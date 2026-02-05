import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight, ArrowRight } from "lucide-react";
import { slugify } from "@/utils/slugify";

interface Course {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  created_at: string;
}

// Different leaf SVG designs
const LeafDesigns = {
  // Simple oval leaf with curved vein (like the screenshot)
  simple: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <path d="M32 4C20 4 10 20 10 36C10 52 20 60 32 60C44 60 54 52 54 36C54 20 44 4 32 4Z" fillOpacity="0.9"/>
      <path d="M32 12C32 12 28 28 32 48" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 24C28 22 24 24 22 28" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 32C36 30 40 32 42 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  // Rounded leaf
  rounded: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <ellipse cx="32" cy="34" rx="20" ry="24" fillOpacity="0.9"/>
      <path d="M32 14V54" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 26C26 24 20 28 18 34" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 38C38 36 44 40 46 46" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  // Pointed leaf
  pointed: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <path d="M32 4L12 40C12 52 20 60 32 60C44 60 52 52 52 40L32 4Z" fillOpacity="0.9"/>
      <path d="M32 8V56" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 28L22 34" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 40L42 46" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  // Heart-shaped leaf
  heart: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <path d="M32 58C32 58 8 40 8 24C8 14 16 8 24 8C28 8 32 12 32 12C32 12 36 8 40 8C48 8 56 14 56 24C56 40 32 58 32 58Z" fillOpacity="0.9"/>
      <path d="M32 16V54" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
    </svg>
  ),
  // Maple-style leaf
  maple: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <path d="M32 4L28 16L16 12L24 24L8 28L24 32L16 44L28 40L32 60L36 40L48 44L40 32L56 28L40 24L48 12L36 16L32 4Z" fillOpacity="0.9"/>
      <path d="M32 8V56" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
    </svg>
  ),
  // Ginkgo-style fan leaf
  ginkgo: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <path d="M32 56V36C32 36 8 32 8 16C8 8 16 4 24 8C28 10 32 16 32 16C32 16 36 10 40 8C48 4 56 8 56 16C56 32 32 36 32 36" fillOpacity="0.9"/>
      <path d="M32 56V20" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M20 16C24 18 28 18 32 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M44 16C40 18 36 18 32 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  // Fern/elongated leaf
  fern: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <path d="M32 4C24 8 20 20 20 36C20 52 26 60 32 60C38 60 44 52 44 36C44 20 40 8 32 4Z" fillOpacity="0.9"/>
      <path d="M32 8V56" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round"/>
      <path d="M32 20L24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 28L40 32" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 36L24 40" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
      <path d="M32 44L40 48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.3" strokeLinecap="round"/>
    </svg>
  ),
  // Clover/trefoil leaf
  clover: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="currentColor">
      <circle cx="32" cy="18" r="12" fillOpacity="0.9"/>
      <circle cx="20" cy="34" r="12" fillOpacity="0.9"/>
      <circle cx="44" cy="34" r="12" fillOpacity="0.9"/>
      <path d="M32 30V58" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.6" strokeLinecap="round"/>
    </svg>
  ),
};

// Background gradient colors for course cards
const GradientColors = [
  { gradient: 'from-amber-400 to-orange-500', leafColor: 'text-amber-100' },
  { gradient: 'from-emerald-400 to-teal-600', leafColor: 'text-emerald-100' },
  { gradient: 'from-cyan-400 to-blue-500', leafColor: 'text-cyan-100' },
  { gradient: 'from-purple-400 to-indigo-600', leafColor: 'text-purple-100' },
  { gradient: 'from-pink-400 to-rose-500', leafColor: 'text-pink-100' },
  { gradient: 'from-lime-400 to-green-600', leafColor: 'text-lime-100' },
  { gradient: 'from-red-400 to-rose-600', leafColor: 'text-red-100' },
  { gradient: 'from-sky-400 to-indigo-500', leafColor: 'text-sky-100' },
];

const LeafTypes = Object.keys(LeafDesigns) as (keyof typeof LeafDesigns)[];

// Better hash function that produces more unique values
const hashString = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
};

// Generate consistent placeholder data based on course id
const getPlaceholderData = (courseId: string) => {
  // Use improved hash for better distribution
  const hash = hashString(courseId);
  // Use different prime multipliers to avoid same combinations
  const colorHash = hashString(courseId + '_color');
  const leafHash = hashString(courseId + '_leaf');
  
  const ratings = [4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
  
  return {
    rating: ratings[hash % ratings.length],
    colorIndex: colorHash % GradientColors.length,
    leafIndex: leafHash % LeafTypes.length,
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

// Course placeholder image component with leaf design
const CoursePlaceholderImage = ({ colorIndex, leafIndex }: { colorIndex: number; leafIndex: number }) => {
  const colorScheme = GradientColors[colorIndex];
  const leafType = LeafTypes[leafIndex];
  const LeafSvg = LeafDesigns[leafType];

  return (
    <div className={`w-full h-40 bg-gradient-to-br ${colorScheme.gradient} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 bg-white/5"></div>
      <div className={colorScheme.leafColor}>
        {LeafSvg}
      </div>
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
          const placeholder = getPlaceholderData(course.id);
          
          return (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/course/${slugify(course.title)}`)}
            >
              {/* Course Image */}
              <div className="relative">
                <CoursePlaceholderImage colorIndex={placeholder.colorIndex} leafIndex={placeholder.leafIndex} />
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

                {/* Description */}
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}

                {/* Start Learning Button */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:text-primary font-medium p-0 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course/${slugify(course.title)}`);
                    }}
                  >
                    Start Learning
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
