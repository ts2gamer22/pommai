"use client";

import { useState, type ChangeEvent } from "react";
import { Popup, Button, Input } from "@pommai/ui";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface CreateChildDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (childId: string) => void;
}

export function CreateChildDialog({ isOpen, onClose, onCreated }: CreateChildDialogProps) {
  const createChild = useMutation(api.children.createChild);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatar, setAvatar] = useState("🧒");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setBirthDate("");
    setAvatar("🧒");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !birthDate.trim()) {
      setError("Please enter a name and birth date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const childId = await createChild({
        name: name.trim(),
        birthDate: birthDate.trim(),
        voiceProfile: undefined,
        avatar: avatar || undefined,
        settings: {
          contentLevel: "elementary",
          safetyLevel: "moderate",
          allowedTopics: ["education", "creativity", "friendship"],
          blockedWords: [],
          dailyTimeLimit: 90,
          bedtimeRestrictions: undefined,
        },
      } as any);

      onCreated?.(childId as unknown as string);
      reset();
      onClose();
    } catch (e: any) {
      console.error("Failed to create child", e);
      setError(e?.message || "Failed to create child");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => {
        if (!saving) {
          reset();
          onClose();
        }
      }}
      title="👶 Add Child Profile"
      bg="#ffffff"
      borderColor="black"
      className="max-w-md"
    >
      <div className="space-y-4">
        {error && (
          <div className="px-3 py-2 border-2 border-red-600 bg-red-100 text-red-800 font-bold text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-black uppercase tracking-wider text-black">Child Name</label>
          <Input
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter child's name"
            bg="#ffffff"
            borderColor="black"
            className="font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-black uppercase tracking-wider text-black">Birth Date</label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthDate(e.target.value)}
            bg="#ffffff"
            borderColor="black"
            className="font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-black uppercase tracking-wider text-black">Avatar (Emoji)</label>
          <Input
            value={avatar}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAvatar(e.target.value)}
            placeholder="🧒"
            bg="#ffffff"
            borderColor="black"
            className="font-bold"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            bg="#f0f0f0"
            textColor="black"
            borderColor="black"
            shadow="#d0d0d0"
            onClick={() => {
              if (!saving) {
                reset();
                onClose();
              }
            }}
            className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift"
          >
            Cancel
          </Button>
          <Button
            bg={name.trim() && birthDate.trim() && !saving ? "#92cd41" : "#f0f0f0"}
            textColor={name.trim() && birthDate.trim() && !saving ? "white" : "#999"}
            borderColor="black"
            shadow={name.trim() && birthDate.trim() && !saving ? "#76a83a" : "#d0d0d0"}
            onClick={handleSubmit}
            disabled={!name.trim() || !birthDate.trim() || saving}
            className={`flex-1 py-2 px-4 font-bold uppercase tracking-wider ${
              name.trim() && birthDate.trim() && !saving ? 'hover-lift' : 'cursor-not-allowed'
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Popup>
  );
}