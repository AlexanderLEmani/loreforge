-- RLS для лекций: чтение для авторизованных

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lectures_select ON lectures;
CREATE POLICY lectures_select ON lectures
  FOR SELECT TO authenticated
  USING (true);
