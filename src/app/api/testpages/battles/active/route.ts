import { NextResponse } from 'next/server';

interface ActiveBattle {
  battleId: string;
  lookIdA: string;
  lookIdB: string;
  createdAt: string;
  endsAt: string | null;
  totalVotes: number;
  completionPercentage: number;
}

// Mock battle data (would come from a database in a real application)
const mockBattles: Record<string, { 
  lookIdA: string; 
  lookIdB: string;
  createdAt: Date;
  endDate: Date | null;
  targetVotes: number;
  isActive: boolean;
}> = {
  'battle1': { 
    lookIdA: 'look1', 
    lookIdB: 'look2',
    createdAt: new Date('2023-11-01'),
    endDate: new Date('2023-11-08'),
    targetVotes: 50,
    isActive: false
  },
  'battle2': { 
    lookIdA: 'look3', 
    lookIdB: 'look4',
    createdAt: new Date('2023-12-05'),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    targetVotes: 100,
    isActive: true
  },
  'battle3': { 
    lookIdA: 'look5', 
    lookIdB: 'look1',
    createdAt: new Date('2023-12-10'),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    targetVotes: 75,
    isActive: true
  },
  'battle4': { 
    lookIdA: 'look2', 
    lookIdB: 'look3',
    createdAt: new Date('2023-12-15'),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    targetVotes: 60,
    isActive: true
  },
};

// Mock vote data
const mockVotes: Record<string, Array<{ lookId: string; userId: string }>> = {
  'battle1': [
    { lookId: 'look1', userId: 'user1' },
    { lookId: 'look2', userId: 'user2' },
    { lookId: 'look1', userId: 'user3' },
    { lookId: 'look1', userId: 'user4' },
    { lookId: 'look2', userId: 'user5' },
  ],
  'battle2': [
    { lookId: 'look3', userId: 'user1' },
    { lookId: 'look4', userId: 'user2' },
    { lookId: 'look4', userId: 'user3' },
    { lookId: 'look4', userId: 'user4' },
  ],
  'battle3': [
    { lookId: 'look5', userId: 'user1' },
    { lookId: 'look5', userId: 'user2' },
    { lookId: 'look1', userId: 'user3' },
  ],
  'battle4': [
    { lookId: 'look2', userId: 'user1' },
    { lookId: 'look3', userId: 'user2' },
    { lookId: 'look2', userId: 'user3' },
    { lookId: 'look2', userId: 'user4' },
    { lookId: 'look3', userId: 'user5' },
  ],
};

export async function GET() {
  try {
    // Get active battles
    const activeBattles: ActiveBattle[] = Object.entries(mockBattles)
      .filter(([_, battle]) => battle.isActive)
      .map(([battleId, battle]) => {
        const votes = mockVotes[battleId] || [];
        const completionPercentage = Math.min(
          Math.round((votes.length / battle.targetVotes) * 100), 
          100
        );
        
        return {
          battleId,
          lookIdA: battle.lookIdA,
          lookIdB: battle.lookIdB,
          createdAt: battle.createdAt.toISOString(),
          endsAt: battle.endDate?.toISOString() || null,
          totalVotes: votes.length,
          completionPercentage
        };
      });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      activeBattles
    });
    
  } catch (error) {
    console.error("Error retrieving active battles:", error);
    return NextResponse.json(
      { error: "Failed to retrieve active battles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { limit, offset } = await request.json();
    
    // Get active battles
    let activeBattles: ActiveBattle[] = Object.entries(mockBattles)
      .filter(([_, battle]) => battle.isActive)
      .map(([battleId, battle]) => {
        const votes = mockVotes[battleId] || [];
        const completionPercentage = Math.min(
          Math.round((votes.length / battle.targetVotes) * 100), 
          100
        );
        
        return {
          battleId,
          lookIdA: battle.lookIdA,
          lookIdB: battle.lookIdB,
          createdAt: battle.createdAt.toISOString(),
          endsAt: battle.endDate?.toISOString() || null,
          totalVotes: votes.length,
          completionPercentage
        };
      });
    
    // Apply pagination if provided
    if (typeof limit === 'number' && limit > 0) {
      const start = typeof offset === 'number' && offset > 0 ? offset : 0;
      activeBattles = activeBattles.slice(start, start + limit);
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      activeBattles
    });
    
  } catch (error) {
    console.error("Error retrieving active battles:", error);
    return NextResponse.json(
      { error: "Failed to retrieve active battles" },
      { status: 500 }
    );
  }
} 