import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, User, ChevronRight, BookOpen, ArrowRight } from "lucide-react";
import { slugify } from "@/utils/slugify";

interface Course {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  created_at: string;
}

// Generate consistent placeholder data based on course id
const getPlaceholderData = (courseId: string, title: string) => {
  // Use course id hash for consistent random-like values
  const hash = courseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const durations = [8, 10, 12, 14, 16, 20, 24];
  const ratings = [4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
  const prices = [49, 59, 69, 79, 89, 99, 120, 149];
  const instructors = [
    { name: "Marcus Chen", role: "Lead Architect" },
    { name: "Elena Petrov", role: "OS Engineer" },
    { name: "Sarah Jenkins", role: "Ex-Google EM" },
    { name: "David Kim", role: "Staff Engineer" },
    { name: "Lisa Wang", role: "Principal SWE" },
    { name: "James Miller", role: "Tech Lead" },
  ];
  
  // Generate placeholder image gradient colors
  const gradients = [
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-purple-400 to-indigo-500',
    'from-pink-400 to-rose-500',
    'from-slate-400 to-gray-500',
  ];
  
  // Icons/shapes for placeholder images
  const icons = ['thumbs-up', 'leaf', 'cursor', 'code', 'lightbulb', 'rocket'];
  
  return {
    duration: durations[hash % durations.length],
    rating: ratings[hash % ratings.length],
    price: prices[hash % prices.length],
    instructor: instructors[hash % instructors.length],
    gradient: gradients[hash % gradients.length],
    icon: icons[hash % icons.length],
  };
};

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < fullStars
              ? 'fill-amber-400 text-amber-400'
              : i === fullStars && hasHalfStar
              ? 'fill-amber-400/50 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-1">({rating})</span>
    </div>
  );
};

// Course placeholder image component
const CoursePlaceholderImage = ({ gradient, title }: { gradient: string; title: string }) => {
  // Get first letter or icon based on title
  const getIcon = () => {
    const lower = title.toLowerCase();
    if (lower.includes('system') || lower.includes('design')) {
      return (
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-white/80" fill="currentColor">
          <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/>
        </svg>
      );
    }
    if (lower.includes('rust') || lower.includes('embedded')) {
      return (
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-white/80" fill="currentColor">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
        </svg>
      );
    }
    // Default cursor/text icon
    return (
      <div className="text-4xl font-serif italic text-white/80 border-2 border-white/60 px-4 py-2 rounded">
        Cure
      </div>
    );
  };

  return (
    <div className={`w-full h-40 bg-gradient-to-br ${gradient} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 bg-white/10"></div>
      {getIcon()}
    </div>
  );
};

interface FeaturedCoursesPreviewProps {
  enabled?: boolean;
}

const FeaturedCoursesPreview = memo(({ enabled = true }: FeaturedCoursesPreviewProps) => {
  const navigate = useNavigate();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, company, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as Course[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const displayCourses = useMemo(() => {
    return (courses || []).slice(0, 3);
  }, [courses]);

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
          <div>
            <div className="h-8 bg-muted rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-muted rounded w-72 animate-pulse"></div>
          </div>
          <div className="h-5 bg-muted rounded w-36 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-muted"></div>
              <div className="p-5">
                <div className="h-4 bg-muted rounded w-24 mb-3"></div>
                <div className="h-5 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-32 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!displayCourses || displayCourses.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Featured Courses
          </h2>
          <p className="text-muted-foreground">
            Deep-dive technical training led by industry experts.
          </p>
        </div>
        <Button 
          variant="link" 
          onClick={() => navigate('/tracks')}
          className="text-primary hover:text-primary/80 font-medium p-0 h-auto"
        >
          Browse All Courses
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCourses.map((course) => {
          const placeholder = getPlaceholderData(course.id, course.title);
          
          return (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/course/${slugify(course.title)}`)}
            >
              {/* Course Image */}
              <div className="relative">
                <CoursePlaceholderImage gradient={placeholder.gradient} title={course.title} />
                {/* Duration Badge */}
                <Badge className="absolute top-3 right-3 bg-slate-800/80 text-white hover:bg-slate-800/80 text-xs font-medium">
                  <Clock className="w-3 h-3 mr-1" />
                  {placeholder.duration} hours
                </Badge>
              </div>

              {/* Course Content */}
              <div className="p-5">
                {/* Company Tag */}
                {course.company && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {course.company}
                  </span>
                )}
                
                {/* Rating */}
                <div className="mt-2">
                  <StarRating rating={placeholder.rating} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mt-2 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>

                {/* Instructor */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                  <User className="w-3.5 h-3.5" />
                  <span>By {placeholder.instructor.name}, {placeholder.instructor.role}</span>
                </div>

                {/* Price and Enrol */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-lg font-bold text-primary">
                    ${placeholder.price}.00
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:text-primary font-medium p-0 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course/${slugify(course.title)}`);
                    }}
                  >
                    Enrol Now
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

FeaturedCoursesPreview.displayName = 'FeaturedCoursesPreview';

export { FeaturedCoursesPreview };
