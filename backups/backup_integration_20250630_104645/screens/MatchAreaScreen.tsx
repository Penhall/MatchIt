import React, { useState } from 'react';
import { COLORS, SPACING, BORDERS, EFFECTS } from '../src/styleConstants';

interface Match {
  id: string;
  name: string;
  photo: string;
  compatibility: number;
  lastInteraction?: string;
  sharedInterests?: number;
}

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    name: 'John Doe',
    photo: 'https://example.com/photo1.jpg',
    compatibility: 85,
    lastInteraction: '2 days ago',
    sharedInterests: 3
  },
  {
    id: '2',
    name: 'Jane Smith',
    photo: 'https://example.com/photo2.jpg',
    compatibility: 92,
    lastInteraction: '1 hour ago',
    sharedInterests: 5
  }
];

const MatchAreaScreen = () => {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);
  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return COLORS.NEON_GREEN;
    if (score >= 80) return COLORS.NEON_BLUE;
    return COLORS.NEON_ORANGE;
  };

  return (
    <div style={{ padding: SPACING.CARD_PADDING_LG }}>
      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        marginBottom: '2.5rem',
        color: COLORS.WHITE,
        letterSpacing: '0.025em'
      }}>
        Your Matches
      </h1>
      
      <div className="match-grid" style={{
        display: 'grid',
        gap: SPACING.LARGE
      }}>
        <style>
          {`
            @media (max-width: 640px) {
              .match-grid {
                gap: ${SPACING.MEDIUM};
              }
            }
          `}
        </style>
        {MOCK_MATCHES.map(match => (
          <div
            key={match.id}
            style={{
              border: `${BORDERS.WIDTH} solid ${BORDERS.COLOR}`,
              borderRadius: BORDERS.RADIUS_MD,
              padding: SPACING.CARD_PADDING,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: COLORS.DARK_CARD,
              transition: EFFECTS.TRANSITION,
              cursor: 'pointer',
              boxShadow: hoveredMatch === match.id ? EFFECTS.GLOW_BLUE : 'none'
            }}
            onMouseEnter={() => setHoveredMatch(match.id)}
            onMouseLeave={() => setHoveredMatch(null)}
          >
            <img
              src={match.photo}
              alt={match.name}
              style={{
                width: '5rem',
                height: '5rem',
                borderRadius: '50%',
                marginRight: SPACING.MEDIUM,
                objectFit: 'cover'
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontWeight: 500,
                color: COLORS.WHITE,
                marginBottom: SPACING.SMALL
              }}>
                {match.name}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.SMALL }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: COLORS.GRAY_300
                }}>
                  Compatibility:
                </span>
                <span style={{
                  fontWeight: 500,
                  color: getCompatibilityColor(match.compatibility)
                }}>
                  {match.compatibility}%
                </span>
              </div>

              {match.lastInteraction && (
                <div style={{
                  fontSize: '0.75rem',
                  color: COLORS.GRAY_400,
                  marginTop: SPACING.SMALL
                }}>
                  Last interaction: {match.lastInteraction}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchAreaScreen;
