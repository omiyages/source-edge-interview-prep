-- Create test resources for course management
-- Run this in Supabase SQL Editor

-- Insert sample resources
INSERT INTO resources (title, description, url, category, created_at) VALUES
('React Fundamentals', 'Learn the basics of React including components, state, and props', 'https://react.dev/learn', 'Frontend', NOW()),
('JavaScript ES6+', 'Modern JavaScript features including arrow functions, destructuring, and modules', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', 'Frontend', NOW()),
('Node.js Backend Development', 'Server-side JavaScript with Node.js, Express, and databases', 'https://nodejs.org/en/docs/', 'Backend', NOW()),
('Database Design', 'SQL fundamentals, database design principles, and optimization', 'https://www.postgresql.org/docs/', 'Database', NOW()),
('System Design', 'Large-scale system architecture, scalability, and performance', 'https://github.com/donnemartin/system-design-primer', 'Architecture', NOW()),
('Docker & Kubernetes', 'Containerization and orchestration for modern applications', 'https://docs.docker.com/', 'DevOps', NOW()),
('AWS Cloud Services', 'Amazon Web Services for cloud computing and deployment', 'https://aws.amazon.com/documentation/', 'Cloud', NOW()),
('Git Version Control', 'Source code management with Git and GitHub workflows', 'https://git-scm.com/doc', 'Tools', NOW()),
('Testing Strategies', 'Unit testing, integration testing, and test-driven development', 'https://jestjs.io/docs/getting-started', 'Testing', NOW()),
('Security Best Practices', 'Web application security, authentication, and authorization', 'https://owasp.org/www-project-top-ten/', 'Security', NOW());

-- Verify the resources were created
SELECT COUNT(*) as total_resources FROM resources;

-- Show the created resources
SELECT id, title, category, created_at 
FROM resources 
ORDER BY created_at DESC;
