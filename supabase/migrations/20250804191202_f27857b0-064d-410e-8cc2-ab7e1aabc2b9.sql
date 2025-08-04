-- Add new hiring stages with proper order
INSERT INTO public.hiring_stages (name, color, stage_order, order_index) VALUES
('Interested, Follow Up', '#f59e0b', 1, 1),
('Scheduled a Call', '#10b981', 2, 2),
('Met - Pending', '#3b82f6', 3, 3),
('CV Sent', '#8b5cf6', 4, 4),
('Interview 1', '#ef4444', 5, 5),
('Interview 2', '#f97316', 6, 6),
('Final Interview', '#06b6d4', 7, 7),
('Offer', '#84cc16', 8, 8),
('Hired', '#22c55e', 9, 9),
('Rejected', '#6b7280', 10, 10)
ON CONFLICT (name) DO UPDATE SET
  stage_order = EXCLUDED.stage_order,
  order_index = EXCLUDED.order_index,
  color = EXCLUDED.color;