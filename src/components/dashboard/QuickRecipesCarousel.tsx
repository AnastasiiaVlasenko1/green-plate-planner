import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

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
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Recipe Ideas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quick Recipe Ideas</CardTitle>
          <Link to="/recipes" className="text-sm text-primary hover:underline flex items-center gap-1">
            Browse all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {recipes?.slice(0, 8).map((recipe) => (
              <CarouselItem key={recipe.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Link
                  to="/recipes"
                  className="group relative block overflow-hidden rounded-lg aspect-[4/3]"
                >
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-medium text-white text-sm line-clamp-1">
                      {recipe.name}
                    </p>
                    <div className="flex items-center gap-3 text-white/80 text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {recipe.calories}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prep_time + recipe.cook_time}m
                      </span>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </CardContent>
    </Card>
  );
}
