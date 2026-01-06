import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Recipe {
  id: string;
  name: string;
  image_url: string;
  calories: number;
  prep_time: number;
  cook_time: number;
}

interface QuickRecipesCarouselProps {
  recipes: Recipe[];
  isLoading?: boolean;
}

export function QuickRecipesCarousel({ recipes, isLoading }: QuickRecipesCarouselProps) {
  if (isLoading) {
    return (
      <Card className="card-shadow h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg">Quick Recipe Ideas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quick Recipe Ideas</CardTitle>
          <Link to="/recipes" className="text-sm text-primary hover:underline flex items-center gap-1">
            Browse all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-2 gap-3 pr-2">
            {recipes?.slice(0, 6).map((recipe) => (
              <Link
                key={recipe.id}
                to="/recipes"
                className="group relative block overflow-hidden rounded-lg aspect-[4/3]"
              >
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="font-medium text-white text-xs line-clamp-1">
                    {recipe.name}
                  </p>
                  <div className="flex items-center gap-2 text-white/80 text-[10px] mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      {recipe.calories}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {recipe.prep_time + recipe.cook_time}m
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
