import { useState } from 'react';
import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

const dietaryOptions = [
  'vegetarian',
  'vegan',
  'keto',
  'paleo',
  'gluten-free',
  'dairy-free',
  'low-carb',
  'high-protein',
];

const allergenOptions = [
  'nuts',
  'peanuts',
  'dairy',
  'eggs',
  'gluten',
  'soy',
  'fish',
  'shellfish',
  'sesame',
];

export default function Profile() {
  const { profile, isLoading, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [dailyCalories, setDailyCalories] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [carbsGoal, setCarbsGoal] = useState('');
  const [fatGoal, setFatGoal] = useState('');
  const [fiberGoal, setFiberGoal] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with profile data
  if (profile && !initialized) {
    setFullName(profile.full_name);
    setDailyCalories(profile.daily_calories.toString());
    setProteinGoal(profile.protein_goal.toString());
    setCarbsGoal(profile.carbs_goal.toString());
    setFatGoal(profile.fat_goal.toString());
    setFiberGoal(profile.fiber_goal.toString());
    setDietaryPreferences(profile.dietary_preferences || []);
    setAllergies(profile.allergies || []);
    setInitialized(true);
  }

  const toggleDietary = (pref: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        daily_calories: parseInt(dailyCalories) || 2000,
        protein_goal: parseInt(proteinGoal) || 150,
        carbs_goal: parseInt(carbsGoal) || 200,
        fat_goal: parseInt(fatGoal) || 65,
        fiber_goal: parseInt(fiberGoal) || 30,
        dietary_preferences: dietaryPreferences,
        allergies,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Profile" showSearch={false} />
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Profile" showSearch={false} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 animate-fade-in max-w-3xl">
        {/* Profile Header */}
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Goals */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Nutrition Goals</CardTitle>
            <CardDescription>Set your daily nutrition targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Daily Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={dailyCalories}
                  onChange={(e) => setDailyCalories(e.target.value)}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(e.target.value)}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(e.target.value)}
                  placeholder="65"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiber">Fiber (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  value={fiberGoal}
                  onChange={(e) => setFiberGoal(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dietary Preferences */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Dietary Preferences</CardTitle>
            <CardDescription>Select your dietary preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((pref) => (
                <Badge
                  key={pref}
                  variant={dietaryPreferences.includes(pref) ? 'default' : 'secondary'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleDietary(pref)}
                >
                  {pref}
                  {dietaryPreferences.includes(pref) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Allergies & Exclusions</CardTitle>
            <CardDescription>Select any food allergies or items to exclude</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map((allergy) => (
                <Badge
                  key={allergy}
                  variant={allergies.includes(allergy) ? 'destructive' : 'secondary'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleAllergy(allergy)}
                >
                  {allergy}
                  {allergies.includes(allergy) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </>
  );
}
