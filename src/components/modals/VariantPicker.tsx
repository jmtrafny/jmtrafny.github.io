/**
 * VariantPicker Modal Component
 *
 * Displays category selection (1-D Chess, Thin Chess, Mini-Board Puzzles)
 */

import type { GameModeCategory } from '../../config/GameModeConfig';

interface VariantPickerProps {
  categories: GameModeCategory[];
  onSelectCategory: (categoryId: string) => void;
  onBack: () => void;
}

export function VariantPicker({ categories, onSelectCategory, onBack }: VariantPickerProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Choose Game Variant</h2>
        <div className="modal-buttons">
          {categories.map((category) => (
            <button
              key={category.id}
              className="modal-btn"
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
              <div className="modal-subtitle">{category.description}</div>
            </button>
          ))}
        </div>
        <button className="modal-btn back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
