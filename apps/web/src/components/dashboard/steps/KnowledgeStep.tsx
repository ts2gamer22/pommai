'use client';

import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Input, Textarea, Button, Card } from '@pommai/ui';
import { 
  Plus, 
  X, 
  Book, 
  Info,
  Sparkles
} from 'lucide-react';

export function KnowledgeStep() {
  const { toyConfig, updateKnowledgeBase } = useToyWizardStore();
  const [newAbility, setNewAbility] = useState('');
  const [newFavoriteThing, setNewFavoriteThing] = useState('');
  const [newCustomFact, setNewCustomFact] = useState<{ category: string; fact: string; importance: 'low' | 'medium' | 'high' }>({ category: '', fact: '', importance: 'medium' });

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
    if (!toyConfig.knowledgeBase) return;
    const abilities = [...(toyConfig.knowledgeBase.toyBackstory.specialAbilities || [])];
    abilities.splice(index, 1);
    updateKnowledgeBase({
      toyBackstory: {
        ...toyConfig.knowledgeBase.toyBackstory,
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
    if (!toyConfig.knowledgeBase) return;
    const things = [...(toyConfig.knowledgeBase.toyBackstory.favoriteThings || [])];
    things.splice(index, 1);
    updateKnowledgeBase({
      toyBackstory: {
        ...toyConfig.knowledgeBase.toyBackstory,
        favoriteThings: things,
      },
    });
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
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-2 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          📚 Build {toyConfig.name}&apos;s Knowledge Base
        </h2>
        <p className="font-geo font-medium text-gray-700 tracking-wide">
          Add information about {toyConfig.name}&apos;s backstory, family details, and special knowledge. This helps create more personalized interactions.
        </p>
      </div>

      <Card
        bg="#f7931e"
        borderColor="black"
        shadowColor="#d67c1a"
        className="p-4"
      >
        <p className="text-sm font-bold text-white flex items-start gap-2 uppercase tracking-wide">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>📝 This step is optional but highly recommended for a more engaging experience. You can always update this information later.</span>
        </p>
      </Card>

      {/* Knowledge Sections */}
      <div className="space-y-4">
        {/* Toy Backstory */}
        <Card
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 sm:p-6"
        >
          <h3 className="retro-h3 text-lg text-black mb-4 flex items-center gap-2">
            <Book className="w-5 h-5" />
            📝 {toyConfig.name}&apos;s Backstory
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-wider text-black">Origin Story</label>
              <Textarea
                value={toyConfig.knowledgeBase?.toyBackstory?.origin || ''}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  initializeKnowledgeBase();
                  if (!toyConfig.knowledgeBase) return;
                  updateKnowledgeBase({
                    toyBackstory: {
                      ...toyConfig.knowledgeBase.toyBackstory,
                      origin: e.target.value,
                    },
                  });
                }}
                placeholder={`Where did ${toyConfig.name} come from? What&apos;s their magical origin?`}
                rows={3}
                bg="#ffffff"
                borderColor="black"
                className="font-bold resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-wider text-black">Personality Background</label>
              <Textarea
                value={toyConfig.knowledgeBase?.toyBackstory?.personality || ''}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  initializeKnowledgeBase();
                  if (!toyConfig.knowledgeBase) return;
                  updateKnowledgeBase({
                    toyBackstory: {
                      ...toyConfig.knowledgeBase.toyBackstory,
                      personality: e.target.value,
                    },
                  });
                }}
                placeholder={`What shaped ${toyConfig.name}&apos;s personality? Any special experiences?`}
                rows={3}
                bg="#ffffff"
                borderColor="black"
                className="font-bold resize-none"
              />
            </div>

            {/* Special Abilities */}
            <div className="space-y-3">
              <label className="block text-sm font-black uppercase tracking-wider text-black">Special Abilities</label>
              <div className="flex gap-2">
                <Input
                  value={newAbility}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAbility(e.target.value)}
                  placeholder={`What special powers does ${toyConfig.name} have?`}
                  onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addSpecialAbility()}
                  bg="#ffffff"
                  borderColor="black"
                  className="font-bold flex-1"
                />
                <Button
                  bg={newAbility.trim() ? "#92cd41" : "#f0f0f0"}
                  textColor={newAbility.trim() ? "white" : "#999"}
                  borderColor="black"
                  shadow={newAbility.trim() ? "#76a83a" : "#d0d0d0"}
                  onClick={addSpecialAbility}
                  disabled={!newAbility.trim()}
                  className={`py-2 px-3 font-bold ${newAbility.trim() ? 'hover-lift' : 'cursor-not-allowed'}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {toyConfig.knowledgeBase?.toyBackstory?.specialAbilities?.map((ability, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#c381b5] text-white flex items-center gap-2"
                  >
                    {ability}
                    <button
                      onClick={() => removeSpecialAbility(index)}
                      className="hover:text-red-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Favorite Things */}
            <div className="space-y-3">
              <label className="block text-sm font-black uppercase tracking-wider text-black">Favorite Things</label>
              <div className="flex gap-2">
                <Input
                  value={newFavoriteThing}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFavoriteThing(e.target.value)}
                  placeholder={`What does ${toyConfig.name} love most?`}
                  onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addFavoriteThing()}
                  bg="#ffffff"
                  borderColor="black"
                  className="font-bold flex-1"
                />
                <Button
                  bg={newFavoriteThing.trim() ? "#92cd41" : "#f0f0f0"}
                  textColor={newFavoriteThing.trim() ? "white" : "#999"}
                  borderColor="black"
                  shadow={newFavoriteThing.trim() ? "#76a83a" : "#d0d0d0"}
                  onClick={addFavoriteThing}
                  disabled={!newFavoriteThing.trim()}
                  className={`py-2 px-3 font-bold ${newFavoriteThing.trim() ? 'hover-lift' : 'cursor-not-allowed'}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {toyConfig.knowledgeBase?.toyBackstory?.favoriteThings?.map((thing, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#f7931e] text-white flex items-center gap-2"
                  >
                    {thing}
                    <button
                      onClick={() => removeFavoriteThing(index)}
                      className="hover:text-red-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Custom Facts */}
        <Card
          bg="#fefcd0"
          borderColor="black"
          shadowColor="#92cd41"
          className="p-4 sm:p-6"
        >
          <h3 className="font-black text-lg uppercase tracking-wider text-black mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            ✨ Custom Knowledge
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase tracking-wider text-black">Category</label>
                <Input
                  value={newCustomFact.category}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCustomFact({ ...newCustomFact, category: e.target.value })}
                  placeholder="e.g., Hobbies, Skills, Memories"
                  bg="#ffffff"
                  borderColor="black"
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase tracking-wider text-black">Importance</label>
                <select
                  value={newCustomFact.importance}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewCustomFact({ ...newCustomFact, importance: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full p-2 border-2 border-black font-bold uppercase tracking-wider text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-wider text-black">Fact</label>
              <Textarea
                value={newCustomFact.fact}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewCustomFact({ ...newCustomFact, fact: e.target.value })}
                placeholder="What should your toy know or remember?"
                rows={2}
                bg="#ffffff"
                borderColor="black"
                className="font-bold resize-none"
              />
            </div>
            
            <Button
              bg={newCustomFact.category && newCustomFact.fact ? "#92cd41" : "#f0f0f0"}
              textColor={newCustomFact.category && newCustomFact.fact ? "white" : "#999"}
              borderColor="black"
              shadow={newCustomFact.category && newCustomFact.fact ? "#76a83a" : "#d0d0d0"}
              onClick={addCustomFact}
              disabled={!newCustomFact.category || !newCustomFact.fact}
              className={`w-full py-2 px-4 font-bold uppercase tracking-wider ${newCustomFact.category && newCustomFact.fact ? 'hover-lift' : 'cursor-not-allowed'}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Fact
            </Button>
            
            {/* Display existing custom facts */}
            {toyConfig.knowledgeBase?.customFacts && toyConfig.knowledgeBase.customFacts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-black text-sm uppercase tracking-wider text-black">Added Facts:</h4>
                <div className="space-y-2">
                  {toyConfig.knowledgeBase.customFacts.map((fact, index) => (
                    <div key={index} className="p-3 border-2 border-black bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#92cd41] text-white mr-2">
                            {fact.category}
                          </span>
                          <span className={`px-1 py-0.5 text-xs font-bold uppercase ${
                            fact.importance === 'high' ? 'text-red-600' :
                            fact.importance === 'medium' ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {fact.importance}
                          </span>
                          <p className="mt-2 text-sm font-bold text-black">{fact.fact}</p>
                        </div>
                        <button
                          onClick={() => {
                            const facts = [...toyConfig.knowledgeBase!.customFacts];
                            facts.splice(index, 1);
                            updateKnowledgeBase({ customFacts: facts });
                          }}
                          className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}