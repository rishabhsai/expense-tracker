-- Insert sample data
INSERT INTO expenses (name, project, cost, billing, category) VALUES
  ('Vercel Pro', 'Portfolio', 75.00, 'monthly', 'Hosting'),
  ('Figma Professional', 'Design System', 530.00, 'yearly', 'Design'),
  ('Linear', 'Task Management', 30.00, 'monthly', 'Productivity'),
  ('Supabase Pro', 'Portfolio', 95.00, 'monthly', 'Database'),
  ('Adobe Creative Cloud', 'Design System', 240.00, 'monthly', 'Design'),
  ('GitHub Pro', 'Development', 48.00, 'yearly', 'Development')
ON CONFLICT (id) DO NOTHING;
