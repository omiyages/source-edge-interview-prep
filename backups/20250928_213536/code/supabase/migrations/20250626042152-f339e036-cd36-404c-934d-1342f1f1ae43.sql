
-- Add information field to course_stages table
ALTER TABLE public.course_stages 
ADD COLUMN information TEXT;

-- Insert a sample course with stages
INSERT INTO public.courses (title, description, created_by) 
VALUES (
  'Google Software Engineer Interview Prep',
  'Comprehensive preparation course for Google Software Engineer positions, covering all interview stages with curated questions and detailed guidance.',
  (SELECT id FROM public.profiles WHERE email = 'sourceedge' LIMIT 1)
);

-- Get the course ID for the sample course
INSERT INTO public.course_stages (course_id, title, description, information, stage_order)
SELECT 
  c.id,
  stage_data.title,
  stage_data.description,
  stage_data.information,
  stage_data.stage_order
FROM public.courses c,
(VALUES 
  ('HR Screen', 'Initial screening with HR team', 'This stage focuses on cultural fit and basic qualifications. **Preparation tips:**

• Research Google''s mission and values
• Prepare STAR method examples for behavioral questions  
• Review your resume and be ready to discuss any project
• Practice explaining technical concepts to non-technical audiences

**What to expect:**
• 30-45 minute phone/video call
• Questions about your background and motivation
• Basic technical screening questions', 1),
  
  ('Technical Assessment', 'Coding challenges and technical questions', 'Technical evaluation of your coding and problem-solving skills. **What to expect:**

• **Data Structures & Algorithms:** Arrays, strings, trees, graphs, dynamic programming
• **System Design:** For senior roles, design scalable systems
• **Live Coding:** Write code in real-time while explaining your thought process

**Preparation strategy:**
• Practice on LeetCode, focusing on medium-hard problems
• Review time and space complexity analysis
• Practice explaining your solution clearly', 2),
  
  ('Cross Interview', 'Cross-functional team interviews', 'Meet with potential teammates and cross-functional partners. **Focus areas:**

• **Collaboration:** How you work with different teams (PM, Design, etc.)
• **Communication:** Explaining complex technical concepts clearly
• **Problem-solving:** Approaching ambiguous problems systematically

**Key tips:**
• Ask clarifying questions before diving into solutions
• Show how you consider different stakeholders
• Demonstrate leadership and mentorship abilities', 3),
  
  ('Final Interview', 'Final round with senior leadership', 'Last step in the interview process with senior engineers or managers. **Key evaluation points:**

• **Technical Leadership:** How you drive technical decisions
• **Strategic Thinking:** Understanding of broader technical landscape  
• **Culture Fit:** Alignment with Google''s engineering culture
• **Growth Potential:** Ability to grow into senior roles

**What makes candidates successful:**
• Clear communication of technical trade-offs
• Examples of mentoring and leading technical initiatives
• Thoughtful questions about the team and challenges', 4)
) AS stage_data(title, description, information, stage_order)
WHERE c.title = 'Google Software Engineer Interview Prep';
