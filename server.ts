import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { getDb, queryAll, queryOne, saveDb } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded images statically with caching
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  immutable: true
}));

app.use(express.json({ limit: '2mb' }));

// Configure Multer for persistent disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomName = `pt_img_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, randomName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPEG, PNG, WebP, and GIF are supported.'));
    }
  }
});

const ALLOWED_CATEGORIES = [
  'General',
  'Tech',
  'Entertainment',
  'Society',
  'Gaming',
  'Food',
  'Sports',
  'Science',
  'Culture'
];

// In-Memory Rate Limiting for Spam Protection
interface RateLimitRecord {
  timestamps: number[];
}
const rateLimits: Record<string, RateLimitRecord> = {};

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (!rateLimits[key]) {
    rateLimits[key] = { timestamps: [now] };
    return true;
  }
  // Filter out expired timestamps
  rateLimits[key].timestamps = rateLimits[key].timestamps.filter(ts => now - ts < windowMs);
  if (rateLimits[key].timestamps.length >= limit) {
    return false;
  }
  rateLimits[key].timestamps.push(now);
  return true;
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'poll'}-${randomSuffix}`;
}

function getVoterFingerprint(req: Request): string {
  const headerFingerprint = req.headers['x-voter-fingerprint'];
  if (typeof headerFingerprint === 'string' && headerFingerprint.trim().length >= 8) {
    return headerFingerprint.trim();
  }
  const bodyFingerprint = req.body?.voterFingerprint;
  if (typeof bodyFingerprint === 'string' && bodyFingerprint.trim().length >= 8) {
    return bodyFingerprint.trim();
  }
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  return crypto.createHash('sha256').update(ip + '-plottwist-anon-salt').digest('hex').slice(0, 24);
}

// Compute real-time poll formatting with actual stored votes, likes, and comments
function formatPollWithRealStats(
  pollRow: any,
  optionsRows: any[],
  realTotalVotes: number,
  optionsVotesMap: Record<string, number>,
  userVoteOptionId: string | null = null,
  likeCount: number = 0,
  hasLiked: boolean = false,
  commentCount: number = 0
) {
  const formattedOptions = optionsRows.map(opt => {
    const voteCount = optionsVotesMap[opt.id] ?? (Number(opt.vote_count) || 0);
    const percentage = realTotalVotes > 0 
      ? Math.round((voteCount / realTotalVotes) * 1000) / 10 
      : 0;

    return {
      id: opt.id,
      text: opt.text,
      voteCount,
      percentage,
      orderIndex: opt.order_index
    };
  });

  return {
    id: pollRow.id,
    slug: pollRow.slug,
    question: pollRow.question,
    description: pollRow.description || '',
    category: pollRow.category || 'General',
    imageUrl: pollRow.image_url || '',
    isSample: Boolean(pollRow.is_sample),
    isVerifiedOrg: Boolean(pollRow.is_verified_org),
    totalVotes: realTotalVotes,
    reportCount: Number(pollRow.report_count) || 0,
    status: pollRow.status,
    createdAt: pollRow.created_at,
    updatedAt: pollRow.updated_at,
    options: formattedOptions,
    hasVoted: Boolean(userVoteOptionId),
    userVotedOptionId: userVoteOptionId || null,
    likeCount,
    hasLiked,
    commentCount
  };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Image Upload Endpoint
app.post('/api/upload', (req: Request, res: Response) => {
  const voterFingerprint = getVoterFingerprint(req);
  if (!checkRateLimit(`upload_${voterFingerprint}`, 10, 5 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many image uploads. Please wait a few minutes before trying again.' });
  }

  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image size exceeds maximum limit of 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'Image upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

// 2. Fetch Polls Feed (Real Data Only, No Fabrications)
app.get('/api/polls', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { sort = 'recent', filter = 'all', category, search, limit = '50', offset = '0' } = req.query;
    const voterFingerprint = getVoterFingerprint(req);

    const conditions: string[] = ["status != 'reported_hidden'"];
    const params: any[] = [];

    // Filter handling
    if (filter === 'community') {
      conditions.push('is_sample = 0');
    } else if (filter === 'sample') {
      conditions.push('is_sample = 1');
    }

    if (category && typeof category === 'string' && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(question) LIKE ? OR LOWER(description) LIKE ? OR LOWER(slug) LIKE ? OR id IN (SELECT poll_id FROM poll_options WHERE LOWER(text) LIKE ?))');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    let orderBy = 'created_at DESC';
    if (sort === 'popular') {
      orderBy = 'total_votes DESC, created_at DESC';
    } else if (sort === 'trending') {
      orderBy = '(total_votes * 2.0 + (strftime("%s", created_at) / 86400)) DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

    const sql = `
      SELECT * FROM polls
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${parsedLimit} OFFSET ${parsedOffset}
    `;

    const pollRows = queryAll(db, sql, params);
    const pollIds = pollRows.map(p => p.id);

    let userVotesMap: Record<string, string> = {};
    let userLikesMap: Record<string, boolean> = {};
    let likeCountsMap: Record<string, number> = {};
    let commentCountsMap: Record<string, number> = {};
    let actualTotalVotesMap: Record<string, number> = {};

    if (pollIds.length > 0) {
      const placeholders = pollIds.map(() => '?').join(',');

      // 1. User votes
      if (voterFingerprint) {
        const votesSql = `SELECT poll_id, option_id FROM poll_votes WHERE voter_fingerprint = ? AND poll_id IN (${placeholders})`;
        const voteRows = queryAll(db, votesSql, [voterFingerprint, ...pollIds]);
        for (const v of voteRows) {
          userVotesMap[v.poll_id] = v.option_id;
        }

        const likesSql = `SELECT poll_id FROM poll_likes WHERE user_fingerprint = ? AND poll_id IN (${placeholders})`;
        const userLikeRows = queryAll(db, likesSql, [voterFingerprint, ...pollIds]);
        for (const l of userLikeRows) {
          userLikesMap[l.poll_id] = true;
        }
      }

      // 2. Real total votes per poll calculated directly from stored vote records
      const realVotesSql = `SELECT poll_id, COUNT(*) as real_votes FROM poll_votes WHERE poll_id IN (${placeholders}) GROUP BY poll_id`;
      const realVoteRows = queryAll(db, realVotesSql, pollIds);
      for (const r of realVoteRows) {
        actualTotalVotesMap[r.poll_id] = Number(r.real_votes);
      }

      // 3. Like counts
      const likeSql = `SELECT poll_id, COUNT(*) as likes_count FROM poll_likes WHERE poll_id IN (${placeholders}) GROUP BY poll_id`;
      const likeRows = queryAll(db, likeSql, pollIds);
      for (const l of likeRows) {
        likeCountsMap[l.poll_id] = Number(l.likes_count);
      }

      // 4. Comment counts
      const commentSql = `SELECT poll_id, COUNT(*) as comments_count FROM poll_comments WHERE status != 'reported_hidden' AND poll_id IN (${placeholders}) GROUP BY poll_id`;
      const commentRows = queryAll(db, commentSql, pollIds);
      for (const c of commentRows) {
        commentCountsMap[c.poll_id] = Number(c.comments_count);
      }
    }

    const results = pollRows.map(poll => {
      const optionsSql = `SELECT * FROM poll_options WHERE poll_id = ? ORDER BY order_index ASC`;
      const optionsRows = queryAll(db, optionsSql, [poll.id]);

      // Count votes per option directly from poll_votes records
      const optVotesSql = `SELECT option_id, COUNT(*) as opt_votes FROM poll_votes WHERE poll_id = ? GROUP BY option_id`;
      const optVotesRows = queryAll(db, optVotesSql, [poll.id]);
      const optVotesMap: Record<string, number> = {};
      for (const ov of optVotesRows) {
        optVotesMap[ov.option_id] = Number(ov.opt_votes);
      }

      const realTotalVotes = actualTotalVotesMap[poll.id] || 0;
      const userVote = userVotesMap[poll.id] || null;
      const likeCount = likeCountsMap[poll.id] || 0;
      const hasLiked = Boolean(userLikesMap[poll.id]);
      const commentCount = commentCountsMap[poll.id] || 0;

      return formatPollWithRealStats(
        poll,
        optionsRows,
        realTotalVotes,
        optVotesMap,
        userVote,
        likeCount,
        hasLiked,
        commentCount
      );
    });

    res.json({
      polls: results,
      total: results.length,
      voterFingerprint
    });
  } catch (err: any) {
    console.error('Error fetching polls:', err);
    res.status(500).json({ error: 'Failed to retrieve polls from database.' });
  }
});

// 3. Fetch Single Poll by ID or Slug
app.get('/api/polls/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { idOrSlug } = req.params;
    const voterFingerprint = getVoterFingerprint(req);

    const poll = queryOne(
      db,
      `SELECT * FROM polls WHERE (id = ? OR slug = ?) AND status != 'reported_hidden'`,
      [idOrSlug, idOrSlug]
    );

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found or has been removed.' });
    }

    const options = queryAll(
      db,
      `SELECT * FROM poll_options WHERE poll_id = ? ORDER BY order_index ASC`,
      [poll.id]
    );

    // Real votes calculated directly from stored vote records
    const realTotalRow = queryOne(
      db,
      `SELECT COUNT(*) as real_votes FROM poll_votes WHERE poll_id = ?`,
      [poll.id]
    );
    const realTotalVotes = Number(realTotalRow?.real_votes) || 0;

    const optVotesRows = queryAll(
      db,
      `SELECT option_id, COUNT(*) as opt_votes FROM poll_votes WHERE poll_id = ? GROUP BY option_id`,
      [poll.id]
    );
    const optVotesMap: Record<string, number> = {};
    for (const ov of optVotesRows) {
      optVotesMap[ov.option_id] = Number(ov.opt_votes);
    }

    let userVoteOptionId: string | null = null;
    let hasLiked = false;

    if (voterFingerprint) {
      const userVote = queryOne(
        db,
        `SELECT option_id FROM poll_votes WHERE poll_id = ? AND voter_fingerprint = ?`,
        [poll.id, voterFingerprint]
      );
      if (userVote) userVoteOptionId = userVote.option_id;

      const userLike = queryOne(
        db,
        `SELECT 1 FROM poll_likes WHERE poll_id = ? AND user_fingerprint = ?`,
        [poll.id, voterFingerprint]
      );
      hasLiked = Boolean(userLike);
    }

    const likeRow = queryOne(db, `SELECT COUNT(*) as likes_count FROM poll_likes WHERE poll_id = ?`, [poll.id]);
    const likeCount = Number(likeRow?.likes_count) || 0;

    const commentRow = queryOne(db, `SELECT COUNT(*) as comments_count FROM poll_comments WHERE poll_id = ? AND status != 'reported_hidden'`, [poll.id]);
    const commentCount = Number(commentRow?.comments_count) || 0;

    res.json(formatPollWithRealStats(
      poll,
      options,
      realTotalVotes,
      optVotesMap,
      userVoteOptionId,
      likeCount,
      hasLiked,
      commentCount
    ));
  } catch (err: any) {
    console.error('Error fetching single poll:', err);
    res.status(500).json({ error: 'Failed to retrieve poll details.' });
  }
});

// 4. Create a Poll (Server-Side Validation, Rate Limiting & Real Storage)
app.post('/api/polls', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const voterFingerprint = getVoterFingerprint(req);

    // Spam protection: Max 6 polls per 5 minutes
    if (!checkRateLimit(`poll_${voterFingerprint}`, 6, 5 * 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a few minutes before creating another poll.' });
    }

    const { question, description = '', category = 'General', imageUrl = '', options } = req.body;

    // Validate Question
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 5) {
      return res.status(400).json({ error: 'Question must be at least 5 characters long.' });
    }
    if (trimmedQuestion.length > 280) {
      return res.status(400).json({ error: 'Question cannot exceed 280 characters.' });
    }

    const trimmedDesc = typeof description === 'string' ? description.trim().slice(0, 500) : '';
    const trimmedImage = typeof imageUrl === 'string' ? imageUrl.trim().slice(0, 500) : '';
    const validCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'General';

    // Validate Options (2 - 6 options)
    if (!Array.isArray(options)) {
      return res.status(400).json({ error: 'Options must be a list of 2 to 6 answers.' });
    }

    const cleanedOptions: string[] = [];
    const seenOptions = new Set<string>();

    for (let i = 0; i < options.length; i++) {
      const opt = typeof options[i] === 'string' ? options[i].trim() : '';
      if (!opt) continue;
      if (opt.length > 100) {
        return res.status(400).json({ error: `Option "${opt.slice(0, 20)}..." exceeds 100 characters.` });
      }
      const lower = opt.toLowerCase();
      if (seenOptions.has(lower)) {
        return res.status(400).json({ error: `Duplicate option: "${opt}". Each option must be distinct.` });
      }
      seenOptions.add(lower);
      cleanedOptions.push(opt);
    }

    if (cleanedOptions.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 non-empty options.' });
    }
    if (cleanedOptions.length > 6) {
      return res.status(400).json({ error: 'A maximum of 6 options is allowed per poll.' });
    }

    const pollId = 'poll_' + crypto.randomBytes(8).toString('hex');
    const slug = slugify(trimmedQuestion);
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO polls (id, slug, question, description, category, image_url, is_sample, is_verified_org, total_votes, report_count, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'active', ?, ?)`,
      [pollId, slug, trimmedQuestion, trimmedDesc, validCategory, trimmedImage, now, now]
    );

    const createdOptions = cleanedOptions.map((optText, index) => {
      const optionId = `opt_${crypto.randomBytes(6).toString('hex')}`;
      db.run(
        `INSERT INTO poll_options (id, poll_id, text, vote_count, order_index)
         VALUES (?, ?, ?, 0, ?)`,
        [optionId, pollId, optText, index]
      );
      return {
        id: optionId,
        text: optText,
        voteCount: 0,
        percentage: 0,
        orderIndex: index
      };
    });

    saveDb();

    res.status(201).json({
      id: pollId,
      slug,
      question: trimmedQuestion,
      description: trimmedDesc,
      category: validCategory,
      imageUrl: trimmedImage,
      isSample: false,
      isVerifiedOrg: false,
      totalVotes: 0,
      reportCount: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      options: createdOptions,
      hasVoted: false,
      userVotedOptionId: null,
      likeCount: 0,
      hasLiked: false,
      commentCount: 0,
      message: 'Poll created successfully!'
    });
  } catch (err: any) {
    console.error('Error creating poll:', err);
    res.status(500).json({ error: 'Database error while saving your poll.' });
  }
});

// 5. Vote on a Poll (Persistent Anonymous ID + Real Stored Records)
app.post('/api/polls/:id/vote', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { optionId } = req.body;
    const voterFingerprint = getVoterFingerprint(req);

    if (!optionId || typeof optionId !== 'string') {
      return res.status(400).json({ error: 'Option selection is required.' });
    }

    const poll = queryOne(
      db,
      `SELECT * FROM polls WHERE (id = ? OR slug = ?) AND status != 'reported_hidden'`,
      [id, id]
    );

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const option = queryOne(
      db,
      `SELECT * FROM poll_options WHERE id = ? AND poll_id = ?`,
      [optionId, poll.id]
    );

    if (!option) {
      return res.status(400).json({ error: 'Invalid option selected for this poll.' });
    }

    // Check duplicate vote using database constraint and query
    const existingVote = queryOne(
      db,
      `SELECT option_id FROM poll_votes WHERE poll_id = ? AND voter_fingerprint = ?`,
      [poll.id, voterFingerprint]
    );

    if (existingVote) {
      return res.status(409).json({
        error: 'You have already voted on this poll from this browser.',
        alreadyVoted: true,
        userVotedOptionId: existingVote.option_id
      });
    }

    const voteId = 'vote_' + crypto.randomBytes(8).toString('hex');
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const now = new Date().toISOString();

    // Atomic insert into poll_votes
    db.run(
      `INSERT INTO poll_votes (id, poll_id, option_id, voter_fingerprint, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [voteId, poll.id, optionId, voterFingerprint, ipHash, now]
    );

    // Update counter columns to stay in sync with real vote table
    db.run(`UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?`, [optionId]);
    db.run(`UPDATE polls SET total_votes = total_votes + 1, updated_at = ? WHERE id = ?`, [now, poll.id]);

    saveDb();

    // Query real vote records for absolute truth
    const realTotalRow = queryOne(
      db,
      `SELECT COUNT(*) as real_votes FROM poll_votes WHERE poll_id = ?`,
      [poll.id]
    );
    const realTotalVotes = Number(realTotalRow?.real_votes) || 1;

    const optVotesRows = queryAll(
      db,
      `SELECT option_id, COUNT(*) as opt_votes FROM poll_votes WHERE poll_id = ? GROUP BY option_id`,
      [poll.id]
    );
    const optVotesMap: Record<string, number> = {};
    for (const ov of optVotesRows) {
      optVotesMap[ov.option_id] = Number(ov.opt_votes);
    }

    const updatedOptions = queryAll(
      db,
      `SELECT * FROM poll_options WHERE poll_id = ? ORDER BY order_index ASC`,
      [poll.id]
    );

    const updatedPoll = queryOne(db, `SELECT * FROM polls WHERE id = ?`, [poll.id]);
    const likeRow = queryOne(db, `SELECT COUNT(*) as likes_count FROM poll_likes WHERE poll_id = ?`, [poll.id]);
    const commentRow = queryOne(db, `SELECT COUNT(*) as comments_count FROM poll_comments WHERE poll_id = ? AND status != 'reported_hidden'`, [poll.id]);

    const formatted = formatPollWithRealStats(
      updatedPoll,
      updatedOptions,
      realTotalVotes,
      optVotesMap,
      optionId,
      Number(likeRow?.likes_count) || 0,
      false,
      Number(commentRow?.comments_count) || 0
    );

    res.json({
      success: true,
      message: 'Vote cast successfully!',
      poll: formatted
    });
  } catch (err: any) {
    console.error('Error casting vote:', err);
    res.status(500).json({ error: 'Database error while saving your vote.' });
  }
});

// 6. Like / Unlike a Poll
app.post('/api/polls/:id/like', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const voterFingerprint = getVoterFingerprint(req);

    const poll = queryOne(db, `SELECT id FROM polls WHERE id = ? OR slug = ?`, [id, id]);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const existingLike = queryOne(
      db,
      `SELECT id FROM poll_likes WHERE poll_id = ? AND user_fingerprint = ?`,
      [poll.id, voterFingerprint]
    );

    let liked = false;
    if (existingLike) {
      db.run(`DELETE FROM poll_likes WHERE poll_id = ? AND user_fingerprint = ?`, [poll.id, voterFingerprint]);
      liked = false;
    } else {
      const likeId = 'like_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO poll_likes (id, poll_id, user_fingerprint, created_at) VALUES (?, ?, ?, ?)`,
        [likeId, poll.id, voterFingerprint, now]
      );
      liked = true;
    }

    saveDb();

    const likeCountRow = queryOne(db, `SELECT COUNT(*) as count FROM poll_likes WHERE poll_id = ?`, [poll.id]);
    const likeCount = Number(likeCountRow?.count) || 0;

    res.json({
      success: true,
      liked,
      likeCount
    });
  } catch (err: any) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Database error updating reaction.' });
  }
});

// 7. Get Comments for a Poll
app.get('/api/polls/:id/comments', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const poll = queryOne(db, `SELECT id FROM polls WHERE id = ? OR slug = ?`, [id, id]);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const sortOrder = req.query.sort === 'oldest' ? 'ASC' : 'DESC';

    const commentRows = queryAll(
      db,
      `SELECT id, poll_id as pollId, comment_text as commentText, author_name as authorName, created_at as createdAt, report_count as reportCount
       FROM poll_comments
       WHERE poll_id = ? AND status != 'reported_hidden'
       ORDER BY created_at ${sortOrder}`,
      [poll.id]
    );

    res.json({
      comments: commentRows,
      total: commentRows.length
    });
  } catch (err: any) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// 8. Add a Comment to a Poll (Login-Free Community)
app.post('/api/polls/:id/comments', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { commentText, authorName } = req.body;
    const authorFingerprint = getVoterFingerprint(req);

    // Spam rate limit: Max 10 comments per 3 minutes
    if (!checkRateLimit(`comment_${authorFingerprint}`, 10, 3 * 60 * 1000)) {
      return res.status(429).json({ error: 'You are commenting too fast. Please take a breath and try again.' });
    }

    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const trimmedComment = commentText.trim();
    if (trimmedComment.length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters.' });
    }

    const poll = queryOne(db, `SELECT id FROM polls WHERE id = ? OR slug = ?`, [id, id]);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const cleanAuthor = typeof authorName === 'string' && authorName.trim()
      ? authorName.trim().slice(0, 30)
      : `Twister #${authorFingerprint.slice(0, 4)}`;

    const commentId = 'com_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO poll_comments (id, poll_id, comment_text, author_name, author_fingerprint, report_count, status, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 'active', ?)`,
      [commentId, poll.id, trimmedComment, cleanAuthor, authorFingerprint, now]
    );

    saveDb();

    res.status(201).json({
      success: true,
      comment: {
        id: commentId,
        pollId: poll.id,
        commentText: trimmedComment,
        authorName: cleanAuthor,
        createdAt: now,
        reportCount: 0
      }
    });
  } catch (err: any) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Database error adding comment.' });
  }
});

// 9. Report a Poll
app.post('/api/polls/:id/report', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { reason, details = '' } = req.body;
    const reporterFingerprint = getVoterFingerprint(req);

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'A valid reason for reporting is required.' });
    }

    const poll = queryOne(db, `SELECT * FROM polls WHERE id = ? OR slug = ?`, [id, id]);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const existingReport = queryOne(
      db,
      `SELECT id FROM poll_reports WHERE poll_id = ? AND reporter_fingerprint = ?`,
      [poll.id, reporterFingerprint]
    );

    if (existingReport) {
      return res.status(200).json({
        success: true,
        message: 'You have already submitted a report for this poll. Our moderation queue has received it.'
      });
    }

    const reportId = 'rep_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const trimmedDetails = typeof details === 'string' ? details.trim().slice(0, 500) : '';

    db.run(
      `INSERT INTO poll_reports (id, poll_id, reason, details, reporter_fingerprint, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reportId, poll.id, reason.trim().slice(0, 100), trimmedDetails, reporterFingerprint, now]
    );

    const newReportCount = (Number(poll.report_count) || 0) + 1;
    const newStatus = newReportCount >= 5 ? 'reported_hidden' : poll.status;

    db.run(
      `UPDATE polls SET report_count = ?, status = ? WHERE id = ?`,
      [newReportCount, newStatus, poll.id]
    );

    saveDb();

    res.json({
      success: true,
      message: 'Thank you for reporting. This poll has been flagged for review.'
    });
  } catch (err: any) {
    console.error('Error reporting poll:', err);
    res.status(500).json({ error: 'Failed to record report.' });
  }
});

// 10. Report a Comment
app.post('/api/comments/:id/report', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { reason } = req.body;
    const reporterFingerprint = getVoterFingerprint(req);

    const comment = queryOne(db, `SELECT * FROM poll_comments WHERE id = ?`, [id]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const existingReport = queryOne(
      db,
      `SELECT id FROM comment_reports WHERE comment_id = ? AND reporter_fingerprint = ?`,
      [id, reporterFingerprint]
    );

    if (existingReport) {
      return res.json({ success: true, message: 'You have already reported this comment.' });
    }

    const reportId = 'cr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO comment_reports (id, comment_id, reason, reporter_fingerprint, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [reportId, id, (reason || 'Inappropriate content').slice(0, 100), reporterFingerprint, now]
    );

    const newReportCount = (Number(comment.report_count) || 0) + 1;
    const newStatus = newReportCount >= 3 ? 'reported_hidden' : comment.status;

    db.run(
      `UPDATE poll_comments SET report_count = ?, status = ? WHERE id = ?`,
      [newReportCount, newStatus, id]
    );

    saveDb();

    res.json({
      success: true,
      message: 'Thank you. The comment has been flagged for moderation.'
    });
  } catch (err: any) {
    console.error('Error reporting comment:', err);
    res.status(500).json({ error: 'Failed to report comment.' });
  }
});

// 11. Categories list
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = queryAll(
      db,
      `SELECT category, COUNT(*) as count FROM polls WHERE status != 'reported_hidden' GROUP BY category`
    );
    const categoryMap: Record<string, number> = {};
    for (const r of rows) {
      categoryMap[r.category] = Number(r.count);
    }
    const categories = ALLOWED_CATEGORIES.map(cat => ({
      name: cat,
      count: categoryMap[cat] || 0
    }));
    res.json(categories);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to load categories.' });
  }
});

// 12. Real Community Stats
app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const totalPollsRow = queryOne(db, `SELECT COUNT(*) as count FROM polls WHERE status != 'reported_hidden'`);
    const totalVotesRow = queryOne(db, `SELECT COUNT(*) as count FROM poll_votes`);
    const communityPollsRow = queryOne(db, `SELECT COUNT(*) as count FROM polls WHERE is_sample = 0 AND status != 'reported_hidden'`);
    const totalCommentsRow = queryOne(db, `SELECT COUNT(*) as count FROM poll_comments WHERE status != 'reported_hidden'`);
    const totalLikesRow = queryOne(db, `SELECT COUNT(*) as count FROM poll_likes`);

    res.json({
      totalPolls: Number(totalPollsRow?.count) || 0,
      totalVotes: Number(totalVotesRow?.count) || 0,
      communityPolls: Number(communityPollsRow?.count) || 0,
      totalComments: Number(totalCommentsRow?.count) || 0,
      totalLikes: Number(totalLikesRow?.count) || 0,
      samplePolls: 0
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// Server Startup with Vite in Dev or Static in Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  await getDb();

  app.listen(PORT, () => {
    console.log(`PlotTwist server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
