'use client';

import { useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  X, 
  Book, 
  Users, 
  Calendar,
  Star,
  Info,
  Sparkles,
  Heart,
  Home
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function KnowledgeStep() {
  const { toyConfig, updateKnowledgeBase } = useToyWizardStore();
  const [newAbility, setNewAbility] = useState('');
  const [newFavoriteThing, setNewFavoriteThing] = useState('');
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', relationship: '', facts: [''] });
  const [newPet, setNewPet] = useState({ name: '', type: '', facts: [''] });
  const [newImportantDate, setNewImportantDate] = useState({ date: '', event: '' });
  const [newCustomFact, setNewCustomFact] = useState({ category: '', fact: '', importance: 'medium' as const });

  const initializeKnowledgeBase = () => {
    if (!toyConfig.knowledgeBase) {
      updateKnowledgeBase({
        toyBackstory: {
          origin: '',
          personality: '',
          specialAbilities: [],
          favoriteThings: [],
        },
        customFacts: [],
      });
    }
  };

  const addSpecialAbility = () => {
    if (newAbility.trim()) {
      initializeKnowledgeBase();
      const abilities = [...(toyConfig.knowledgeBase?.toyBackstory.specialAbilities || []), newAbility.trim()];
      updateKnowledgeBase({
        toyBackstory: {
          ...toyConfig.knowledgeBase!.toyBackstory,
          specialAbilities: abilities,
        },
      });
      setNewAbility('');
    }
  };

  const removeSpecialAbility = (index: number) => {
    const abilities = [...(toyConfig.knowledgeBase?.toyBackstory.specialAbilities || [])];
    abilities.splice(index, 1);
    updateKnowledgeBase({
      toyBackstory: {
        ...toyConfig.knowledgeBase!.toyBackstory,
        specialAbilities: abilities,
      },
    });
  };

  const addFavoriteThing = () => {
    if (newFavoriteThing.trim()) {
      initializeKnowledgeBase();
      const things = [...(toyConfig.knowledgeBase?.toyBackstory.favoriteThings || []), newFavoriteThing.trim()];
      updateKnowledgeBase({
        toyBackstory: {
          ...toyConfig.knowledgeBase!.toyBackstory,
          favoriteThings: things,
        },
      });
      setNewFavoriteThing('');
    }
  };

  const removeFavoriteThing = (index: number) => {
    const things = [...(toyConfig.knowledgeBase?.toyBackstory.favoriteThings || [])];
    things.splice(index, 1);
    updateKnowledgeBase({
      toyBackstory: {
        ...toyConfig.knowledgeBase!.toyBackstory,
        favoriteThings: things,
      },
    });
  };

  const addFamilyMember = () => {
    if (newFamilyMember.name && newFamilyMember.relationship) {
      initializeKnowledgeBase();
      const members = [...(toyConfig.knowledgeBase?.familyInfo?.members || [])];
      members.push({
        ...newFamilyMember,
        facts: newFamilyMember.facts.filter(f => f.trim()),
      });
      updateKnowledgeBase({
        familyInfo: {
          ...toyConfig.knowledgeBase?.familyInfo,
          members,
          pets: toyConfig.knowledgeBase?.familyInfo?.pets || [],
          importantDates: toyConfig.knowledgeBase?.familyInfo?.importantDates || [],
        },
      });
      setNewFamilyMember({ name: '', relationship: '', facts: [''] });
    }
  };

  const addCustomFact = () => {
    if (newCustomFact.category && newCustomFact.fact) {
      initializeKnowledgeBase();
      const facts = [...(toyConfig.knowledgeBase?.customFacts || [])];
      facts.push({
        category: newCustomFact.category,
        fact: newCustomFact.fact,
        importance: newCustomFact.importance,
      });
      updateKnowledgeBase({ customFacts: facts });
      setNewCustomFact({ category: '', fact: '', importance: 'medium' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Build {toyConfig.name}'s Knowledge Base
        </h2>
        <p className="text-gray-600">
          Add information about {toyConfig.name}'s backstory, family details, and special knowledge. This helps create more personalized interactions.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>This step is optional but highly recommended for a more engaging experience. You can always update this information later.</span>
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* Toy Backstory */}
        <AccordionItem value="backstory">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              <span>{toyConfig.name}'s Backstory</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin Story</Label>
              <Textarea
                id="origin"
                value={toyConfig.knowledgeBase?.toyBackstory.origin || ''}
                onChange={(e) => {
                  initializeKnowledgeBase();
                  updateKnowledgeBase({
                    toyBackstory: {
                      ...toyConfig.knowledgeBase!.toyBackstory,
                      origin: e.target.value,
                    },
                  });
                }}
                placeholder={`Where did ${toyConfig.name} come from? What's their magical origin?`}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality-backstory">Personality Background</Label>
              <Textarea
                id="personality-backstory"
                value={toyConfig.knowledgeBase?.toyBackstory.personality || ''}
                onChange={(e) => {
                  initializeKnowledgeBase();
                  updateKnowledgeBase({
                    toyBackstory: {
                      ...toyConfig.knowledgeBase!.toyBackstory,
                      personality: e.target.value,
                    },
                  });
                }}
                placeholder={`What shaped ${toyConfig.name}'s personality? Any key experiences?`}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Special Abilities</Label>
              <div className="flex gap-2">
                <Input
                  value={newAbility}
                  onChange={(e) => setNewAbility(e.target.value)}
                  placeholder="Add a special ability..."
                  onKeyPress={(e) => e.key === 'Enter' && addSpecialAbility()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addSpecialAbility}
                  disabled={!newAbility.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {toyConfig.knowledgeBase?.toyBackstory.specialAbilities.map((ability, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {ability}
                    <button
                      onClick={() => removeSpecialAbility(index)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favorite Things</Label>
              <div className="flex gap-2">
                <Input
                  value={newFavoriteThing}
                  onChange={(e) => setNewFavoriteThing(e.target.value)}
                  placeholder="Add a favorite thing..."
                  onKeyPress={(e) => e.key === 'Enter' && addFavoriteThing()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addFavoriteThing}
                  disabled={!newFavoriteThing.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {toyConfig.knowledgeBase?.toyBackstory.favoriteThings.map((thing, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    <Heart className="w-3 h-3 mr-1" />
                    {thing}
                    <button
                      onClick={() => removeFavoriteThing(index)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Family Information */}
        <AccordionItem value="family">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Family Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <Label>Family Members</Label>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Input
                  placeholder="Member name"
                  value={newFamilyMember.name}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                />
                <Input
                  placeholder="Relationship (e.g., Mom, Dad, Sister)"
                  value={newFamilyMember.relationship}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, relationship: e.target.value })}
                />
                <Input
                  placeholder="Fun fact about this person (optional)"
                  value={newFamilyMember.facts[0] || ''}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, facts: [e.target.value] })}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addFamilyMember}
                  disabled={!newFamilyMember.name || !newFamilyMember.relationship}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family Member
                </Button>
              </div>

              {/* Display existing family members */}
              {toyConfig.knowledgeBase?.familyInfo?.members && toyConfig.knowledgeBase.familyInfo.members.length > 0 && (
                <div className="space-y-2">
                  {toyConfig.knowledgeBase.familyInfo.members.map((member, index) => (
                    <div key={index} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.relationship}</p>
                          {member.facts.length > 0 && member.facts[0] && (
                            <p className="text-sm text-gray-500 mt-1">{member.facts[0]}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const members = [...toyConfig.knowledgeBase!.familyInfo!.members];
                            members.splice(index, 1);
                            updateKnowledgeBase({
                              familyInfo: {
                                ...toyConfig.knowledgeBase!.familyInfo!,
                                members,
                              },
                            });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Custom Facts */}
        <AccordionItem value="custom-facts">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>Custom Knowledge</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <Label>Add Custom Facts</Label>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Input
                  placeholder="Category (e.g., Hobbies, School, Friends)"
                  value={newCustomFact.category}
                  onChange={(e) => setNewCustomFact({ ...newCustomFact, category: e.target.value })}
                />
                <Textarea
                  placeholder="Fact or information"
                  value={newCustomFact.fact}
                  onChange={(e) => setNewCustomFact({ ...newCustomFact, fact: e.target.value })}
                  rows={2}
                />
                <Select
                  value={newCustomFact.importance}
                  onValueChange={(value) => setNewCustomFact({ ...newCustomFact, importance: value as 'high' | 'medium' | 'low' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Importance level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High importance</SelectItem>
                    <SelectItem value="medium">Medium importance</SelectItem>
                    <SelectItem value="low">Low importance</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={addCustomFact}
                  disabled={!newCustomFact.category || !newCustomFact.fact}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Fact
                </Button>
              </div>

              {/* Display existing custom facts */}
              {toyConfig.knowledgeBase?.customFacts && toyConfig.knowledgeBase.customFacts.length > 0 && (
                <div className="space-y-2">
                  {toyConfig.knowledgeBase.customFacts.map((fact, index) => (
                    <div key={index} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              fact.importance === 'high' ? 'default' :
                              fact.importance === 'medium' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {fact.importance}
                            </Badge>
                            <p className="font-medium text-sm">{fact.category}</p>
                          </div>
                          <p className="text-sm text-gray-600">{fact.fact}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const facts = [...toyConfig.knowledgeBase!.customFacts];
                            facts.splice(index, 1);
                            updateKnowledgeBase({ customFacts: facts });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
