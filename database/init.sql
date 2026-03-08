-- ChainFind PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- ─────────────────────────────────────────
--  ITEMS (NFT registrations)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id        VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    serial_number   VARCHAR(255),
    ipfs_hash       VARCHAR(255),
    owner_wallet    VARCHAR(42) NOT NULL,
    status          VARCHAR(20) DEFAULT 'registered'
                    CHECK (status IN ('registered','lost','found','returned','revoked')),
    reward_amount   DECIMAL(18,8) DEFAULT 0,
    finder_wallet   VARCHAR(42),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    tx_hash         VARCHAR(66),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_status     ON items(status);
CREATE INDEX idx_items_owner      ON items(owner_wallet);
CREATE INDEX idx_items_category   ON items(category);
CREATE INDEX idx_items_desc_trgm  ON items USING GIN(description gin_trgm_ops);
CREATE INDEX idx_items_name_trgm  ON items USING GIN(name gin_trgm_ops);

-- ─────────────────────────────────────────
--  LOST REPORTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lost_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id        VARCHAR(50) NOT NULL REFERENCES items(token_id),
    location        VARCHAR(500) NOT NULL,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    lost_at         TIMESTAMP NOT NULL,
    details         TEXT,
    reward_amount   DECIMAL(18,8) DEFAULT 0,
    tx_hash         VARCHAR(66),
    active          BOOLEAN DEFAULT true,
    expires_at      TIMESTAMP DEFAULT (NOW() + INTERVAL '90 days'),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lost_active    ON lost_reports(active);
CREATE INDEX idx_lost_token     ON lost_reports(token_id);
CREATE INDEX idx_lost_location  ON lost_reports USING GIN(location gin_trgm_ops);

-- ─────────────────────────────────────────
--  FOUND REPORTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS found_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id        VARCHAR(50) REFERENCES items(token_id),
    finder_wallet   VARCHAR(42) NOT NULL,
    location        VARCHAR(500) NOT NULL,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    description     TEXT NOT NULL,
    ipfs_hash       VARCHAR(255),
    ai_match_score  DECIMAL(5,2),
    matched_token   VARCHAR(50),
    tx_hash         VARCHAR(66),
    confirmed       BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_found_token   ON found_reports(token_id);
CREATE INDEX idx_found_finder  ON found_reports(finder_wallet);
CREATE INDEX idx_found_desc    ON found_reports USING GIN(description gin_trgm_ops);

-- ─────────────────────────────────────────
--  CHAT MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         VARCHAR(50) NOT NULL,   -- typically token_id
    sender_wallet   VARCHAR(42) NOT NULL,
    role            VARCHAR(10) CHECK (role IN ('owner','finder')),
    encrypted_msg   TEXT NOT NULL,          -- AES-256 encrypted
    iv              VARCHAR(64) NOT NULL,    -- AES initialization vector
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_case   ON chat_messages(case_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_wallet);

-- ─────────────────────────────────────────
--  FINDER REPUTATION (Soulbound)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finder_reputation (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address  VARCHAR(42) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    total_score     INTEGER DEFAULT 0,
    return_count    INTEGER DEFAULT 0,
    avg_rating      DECIMAL(3,2) DEFAULT 0,
    sbt_token_id    VARCHAR(50),
    badges          TEXT[],
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rep_wallet ON finder_reputation(wallet_address);
CREATE INDEX idx_rep_score  ON finder_reputation(total_score DESC);

-- ─────────────────────────────────────────
--  POLICE CUSTODY LOG
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS police_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id      VARCHAR(100) NOT NULL,
    station_name    VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(100),
    location        VARCHAR(500),
    case_number     VARCHAR(100) UNIQUE NOT NULL,
    token_id        VARCHAR(50),            -- matched NFT if found
    ipfs_hash       VARCHAR(255),
    tx_hash         VARCHAR(66),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  TRANSACTION LOG
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tx_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_type     VARCHAR(30) NOT NULL,
    tx_hash     VARCHAR(66),
    description TEXT,
    wallet      VARCHAR(42),
    token_id    VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  SEED DATA (demo items)
-- ─────────────────────────────────────────
INSERT INTO items (token_id, name, category, description, serial_number, owner_wallet, status, reward_amount, latitude, longitude)
VALUES
  ('NFT-001','Black Leather Wallet','Wallet / Purse','Genuine leather, brown interior, Aadhaar & 3 debit cards inside','Initials AK carved inside','0x7f3a9e2c4b1d8f0e3a6c9b2e5d8f1a4c','lost',500,13.0827,80.2707),
  ('NFT-002','iPhone 14 Pro Max','Phone / Tablet','Space Black, cracked screen protector, red case with elephant keychain','IMEI: 354-871-09-234567','0x3b1c4d8f2a9e0c7f5b8e1d4a7c0f3e6b','lost',2000,13.1986,80.2986),
  ('NFT-003','Blue Jansport Backpack','Bag / Backpack','Navy blue, college name tag, contains laptop & notebooks','Tag: BITSHY-22-CS-089','0x9a2d7e1b4c8f0e3a6d9c2b5e8f1a4d7c','found',300,13.0569,80.2425),
  ('NFT-004','Gold Mangalsutra','Jewellery','22k gold, 18 inch chain, diamond pendant','Hallmark: 22K-BIS-2021','0x2e8f1a3c6d9b4e7f0a3c6b9e2d5f8c1a','lost',5000,13.0674,80.2176),
  ('NFT-005','Passport + Travel Wallet','Documents','Indian passport, blue travel wallet, Zurich flight tickets inside','Passport: Z-1847392','0x6c4a8b2e5d8f1a4c7e0b3d6f9a2c5e8b','lost',1000,12.9941,80.1709);

INSERT INTO finder_reputation (wallet_address, display_name, total_score, return_count, avg_rating, badges)
VALUES
  ('0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6','RailwayHelper_TN',780,12,4.9,'{"🏆 Legend","✅ Verified"}'),
  ('0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0','HonestFinder99',520,8,4.8,'{"🥈 Expert","✅ Verified"}'),
  ('0xb3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8','GoodSamaritan',320,5,4.7,'{"🥉 Verified"}');

INSERT INTO tx_log (tx_type, tx_hash, description, token_id)
VALUES
  ('mint','0x8f3a2e1b4c9d7f0e','NFT-001 minted for Black Leather Wallet','NFT-001'),
  ('lost','0x1c4d9f0a3e7b2d5f','Lost report filed for NFT-002','NFT-002'),
  ('found','0x7b2e3c8d1f5a9e4b','Found report submitted for NFT-003','NFT-003'),
  ('reward','0x4a9f6b1e3d8c2f7a','500 MATIC reward released for NFT-003','NFT-003');
