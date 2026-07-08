ALTER TABLE integrations 
  ADD COLUMN sync_state TEXT DEFAULT 'idle',
  ADD COLUMN sync_pages_completed INT DEFAULT 0,
  ADD COLUMN sync_pages_total INT DEFAULT 0;
