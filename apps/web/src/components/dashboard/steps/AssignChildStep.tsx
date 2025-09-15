"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, Button } from "@pommai/ui";
import { Users, Plus } from "lucide-react";
import { useToyWizardStore } from "@/stores/toyWizardStore";
import { CreateChildDialog } from "../../guardian/CreateChildDialog";

export function AssignChildStep() {
  const children = useQuery(api.children.listChildren, {});
  const { toyConfig, updateToyConfig } = useToyWizardStore();
  const [selectedId, setSelectedId] = useState<string | null>(toyConfig.assignedChildId || null);
  const [showCreate, setShowCreate] = useState(false);
  const [skipAssignment, setSkipAssignment] = useState(false);

  useEffect(() => {
    if (!selectedId && children && children.length > 0) {
      setSelectedId(children[0]._id);
    }
  }, [children, selectedId]);

  useEffect(() => {
    updateToyConfig("assignedChildId" as any, skipAssignment ? null : selectedId as any);
  }, [selectedId, skipAssignment, updateToyConfig]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="retro-h3 text-base sm:text-lg text-black flex items-center gap-2">
            <Users className="w-5 h-5" /> {toyConfig.isForKids ? 'Assign to Child' : 'Optional: Assign to Child'}
          </h3>
          {toyConfig.isForKids && (
            <p className="text-sm font-bold text-gray-600 mt-1">Since this toy is for kids, assign it to a child profile.</p>
          )}
        </div>
        <Button
          bg="#92cd41"
          textColor="white"
          borderColor="black"
          shadow="#76a83a"
          onClick={() => setShowCreate(true)}
          className="py-2 px-3 font-black uppercase tracking-wider hover-lift text-xs sm:text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Child
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children?.map((c: any) => (
          <Card
            key={c._id}
            bg={selectedId === c._id ? "#c381b5" : "#ffffff"}
            borderColor="black"
            shadowColor={selectedId === c._id ? "#8b5fa3" : "#e0e0e0"}
            className={`p-4 cursor-pointer transition-all hover-lift ${
              selectedId === c._id ? 'text-white' : 'text-black'
            }`}
            onClick={() => setSelectedId(c._id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{(c as any).avatar || "🧒"}</div>
                <div>
                  <h4 className="font-black uppercase tracking-wider">{c.name}</h4>
                  <p className={`text-sm font-bold uppercase tracking-wide ${
                    selectedId === c._id ? 'text-white opacity-90' : 'text-gray-600'
                  }`}>
                    Born {new Date(c.birthDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {selectedId === c._id && (
                <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-white bg-[#92cd41] text-white">
                  Selected
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {!children || children.length === 0 ? (
        <p className="font-bold uppercase tracking-wide text-gray-600 text-sm">No children yet. Add one to continue.</p>
      ) : null}

      {!toyConfig.isForKids && (
        <div className="mt-4 p-4 border-2 border-gray-300 bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipAssignment}
              onChange={(e) => setSkipAssignment(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-bold text-gray-700">Skip child assignment (toy for general use)</span>
          </label>
        </div>
      )}

      <CreateChildDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => {
          setSelectedId(id);
          setShowCreate(false);
        }}
      />
    </div>
  );
}