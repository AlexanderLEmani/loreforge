ALTER TABLE skill_tree_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_tree_nodes_select ON skill_tree_nodes;
CREATE POLICY skill_tree_nodes_select ON skill_tree_nodes
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_skills_select_own ON user_skills;
CREATE POLICY user_skills_select_own ON user_skills
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_skills_insert_own ON user_skills;
CREATE POLICY user_skills_insert_own ON user_skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
