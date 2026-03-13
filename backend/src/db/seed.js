const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding demo data into Neon...');
    const hash = await bcrypt.hash('demo1234', 12);

    // Super Admin (no academy)
    const superAdminId = uuid();
    await client.query(
      `INSERT INTO users (id,name,email,password_hash,role,rating,is_active,created_at)
       VALUES ($1,'Super Admin','superadmin@demo.com',$2,'super_admin',2000,true,NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [superAdminId, hash]
    );
    console.log('  ✅ Super Admin created');

    // Academy + Admin
    const academyId = uuid();
    const academyAdminId = uuid();

    // Insert academy first (owner_id will be updated after user insert)
    await client.query(
      `INSERT INTO academies (id,name,subdomain,plan,is_active,max_students,created_at)
       VALUES ($1,'Demo Chess Academy','demo-academy','academy',true,500,NOW())
       ON CONFLICT (subdomain) DO NOTHING`,
      [academyId]
    );

    await client.query(
      `INSERT INTO users (id,name,email,password_hash,role,academy_id,rating,is_active,created_at)
       VALUES ($1,'Academy Admin','academy@demo.com',$2,'academy_admin',$3,1500,true,NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, academy_id = $3`,
      [academyAdminId, hash, academyId]
    );

    await client.query(
      `UPDATE academies SET owner_id = $1 WHERE id = $2`,
      [academyAdminId, academyId]
    );
    console.log('  ✅ Academy + Admin created');

    // Coach
    const coachId = uuid();
    await client.query(
      `INSERT INTO users (id,name,email,password_hash,role,academy_id,rating,is_active,created_at)
       VALUES ($1,'Coach Vikram','coach@demo.com',$2,'coach',$3,1800,true,NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, academy_id = $3`,
      [coachId, hash, academyId]
    );
    console.log('  ✅ Coach created');

    // Student
    const studentId = uuid();
    await client.query(
      `INSERT INTO users (id,name,email,password_hash,role,academy_id,rating,is_active,created_at)
       VALUES ($1,'Arjun Student','student@demo.com',$2,'student',$3,1210,true,NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, academy_id = $3`,
      [studentId, hash, academyId]
    );
    console.log('  ✅ Student created');

    // Parent
    const parentId = uuid();
    await client.query(
      `INSERT INTO users (id,name,email,password_hash,role,academy_id,rating,is_active,created_at)
       VALUES ($1,'Parent User','parent@demo.com',$2,'parent',$3,0,true,NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, academy_id = $3`,
      [parentId, hash, academyId]
    );
    console.log('  ✅ Parent created');

    // Batch
    const batchId = uuid();
    await client.query(
      `INSERT INTO batches (id,academy_id,coach_id,name,level,max_students,is_active)
       VALUES ($1,$2,$3,'Intermediate Batch A','intermediate',20,true)
       ON CONFLICT DO NOTHING`,
      [batchId, academyId, coachId]
    );

    // Enroll student in batch
    await client.query(
      `INSERT INTO batch_enrollments (batch_id,student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [batchId, studentId]
    );
    console.log('  ✅ Batch + enrollment created');

    // Sample puzzles
    const puzzles = [
      {
        id: 'demo_p001',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        moves: 'f3g5 f6e4 g5f7',
        rating: 1250,
        themes: ['fork', 'knight_fork'],
      },
      {
        id: 'demo_p002',
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        moves: 'a1a8',
        rating: 800,
        themes: ['back_rank', 'rook'],
      },
      {
        id: 'demo_p003',
        fen: 'r1b1kb1r/pppp1ppp/2n2n2/4p2q/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5',
        moves: 'c4f7 e8f7 f3g5 f7g8 d1h5',
        rating: 1600,
        themes: ['combination', 'sacrifice', 'attack'],
      },
    ];

    for (const p of puzzles) {
      await client.query(
        `INSERT INTO puzzles (id,fen,moves,rating,themes,nb_plays)
         VALUES ($1,$2,$3,$4,$5,0)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.fen, p.moves, p.rating, p.themes]
      );
    }
    console.log('  ✅ Sample puzzles created');

    // Sample classroom
    const classroomId = uuid();
    await client.query(
      `INSERT INTO classrooms (id,academy_id,batch_id,coach_id,title,description,scheduled_at,duration_min,status,created_at)
       VALUES ($1,$2,$3,$4,'Sicilian Defense — Intermediate','Learn the Dragon and Najdorf variations',
         NOW() + INTERVAL '1 hour',60,'scheduled',NOW())
       ON CONFLICT DO NOTHING`,
      [classroomId, academyId, batchId, coachId]
    );
    console.log('  ✅ Sample classroom created');

    // Sample tournament
    const tournamentId = uuid();
    await client.query(
      `INSERT INTO tournaments (id,academy_id,organizer_id,name,format,status,time_control,
         rounds,max_players,is_public,starts_at,created_at)
       VALUES ($1,$2,$3,'Summer Open 2024','swiss','upcoming','10+5',7,64,true,
         NOW() + INTERVAL '3 days',NOW())
       ON CONFLICT DO NOTHING`,
      [tournamentId, academyId, academyAdminId]
    );
    console.log('  ✅ Sample tournament created');

    console.log('\n🎉 All demo data seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo Accounts (password: demo1234)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Super Admin  →  superadmin@demo.com');
    console.log('  Academy Admin→  academy@demo.com');
    console.log('  Coach        →  coach@demo.com');
    console.log('  Student      →  student@demo.com');
    console.log('  Parent       →  parent@demo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
