-- RLS для user_equipment (если на проекте включён RLS по умолчанию)
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_equipment_select_own ON user_equipment;
CREATE POLICY user_equipment_select_own ON user_equipment
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_equipment_insert_own ON user_equipment;
CREATE POLICY user_equipment_insert_own ON user_equipment
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_equipment_update_own ON user_equipment;
CREATE POLICY user_equipment_update_own ON user_equipment
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
