import { NextResponse } from 'next/server';

interface BattleStats {
  totalBattles: number;
  totalVotes: number;
  mostVotedBattleId: string | null;
  mostVotedBattleCount: number;
  recentBattles: Array<{
    battleId: string;
    lookIdA: string;
    lookIdB: string;
    totalVotes: number;
    completionPercentage: number;
  }>;
}

// Mock battle data
const mockBattles: Record<string, { 
  lookIdA: string; 
  lookIdB: string;
  createdAt: Date;
  endDate: Date | null;
  targetVotes: number;
}> = {
  'battle1': { 
    lookIdA: 'look1', 
    lookIdB: 'look2',
    createdAt: new Date('2023-11-01'),
    endDate: new Date('2023-11-08'),
    targetVotes: 50
  },
  'battle2': { 
    lookIdA: 'look3', 
    lookIdB: 'look4',
    createdAt: new Date('2023-11-05'),
    endDate: null,
    targetVotes: 100
  },
  'battle3': { 
    lookIdA: 'look5', 
    lookIdB: 'look1',
    createdAt: new Date('2023-11-10'),
    endDate: null,
    targetVotes: 75
  },
  'battle4': { 
    lookIdA: 'look2', 
    lookIdB: 'look3',
    createdAt: new Date('2023-11-15'),
    endDate: null,
    targetVotes: 60
  },
};

// Mock vote data (these would be stored in a database in a real application)
const mockVotes: Record<string, Array<{ lookId: string; userId: string; timestamp: Date }>> = {
  'battle1': [
    { lookId: 'look1', userId: 'user1', timestamp: new Date('2023-11-01') },
    { lookId: 'look2', userId: 'user2', timestamp: new Date('2023-11-02') },
    { lookId: 'look1', userId: 'user3', timestamp: new Date('2023-11-03') },
    { lookId: 'look1', userId: 'user4', timestamp: new Date('2023-11-04') },
    { lookId: 'look2', userId: 'user5', timestamp: new Date('2023-11-05') },
  ],
  'battle2': [
    { lookId: 'look3', userId: 'user1', timestamp: new Date('2023-11-06') },
    { lookId: 'look4', userId: 'user2', timestamp: new Date('2023-11-07') },
    { lookId: 'look4', userId: 'user3', timestamp: new Date('2023-11-08') },
    { lookId: 'look4', userId: 'user4', timestamp: new Date('2023-11-09') },
  ],
  'battle3': [
    { lookId: 'look5', userId: 'user1', timestamp: new Date('2023-11-11') },
    { lookId: 'look5', userId: 'user2', timestamp: new Date('2023-11-12') },
    { lookId: 'look1', userId: 'user3', timestamp: new Date('2023-11-13') },
  ],
  'battle4': [
    { lookId: 'look2', userId: 'user1', timestamp: new Date('2023-11-16') },
    { lookId: 'look3', userId: 'user2', timestamp: new Date('2023-11-17') },
    { lookId: 'look2', userId: 'user3', timestamp: new Date('2023-11-18') },
    { lookId: 'look2', userId: 'user4', timestamp: new Date('2023-11-19') },
    { lookId: 'look3', userId: 'user5', timestamp: new Date('2023-11-20') },
    { lookId: 'look3', userId: 'user6', timestamp: new Date('2023-11-21') },
  ],
};

export async function GET() {
  try {
    // Calculate total votes across all battles
    let totalVotes = 0;
    let mostVotedBattleId: string | null = null;
    let mostVotedBattleCount = 0;
    
    const battleIds = Object.keys(mockBattles);
    
    // Find the battle with the most votes
    for (const battleId of battleIds) {
      const battleVotes = mockVotes[battleId]?.length || 0;
      totalVotes += battleVotes;
      
      if (battleVotes > mostVotedBattleCount) {
        mostVotedBattleCount = battleVotes;
        mostVotedBattleId = battleId;
      }
    }
    
    // Get recent battles (sorted by creation date)
    const recentBattles = battleIds
      .map(battleId => {
        const battle = mockBattles[battleId];
        const votes = mockVotes[battleId] || [];
        const completionPercentage = Math.min(
          Math.round((votes.length / battle.targetVotes) * 100),
          100
        );
        
        return {
          battleId,
          lookIdA: battle.lookIdA,
          lookIdB: battle.lookIdB,
          totalVotes: votes.length,
          completionPercentage,
          createdAt: battle.createdAt,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort newest first
      .slice(0, 5) // Get the 5 most recent battles
      .map(({ battleId, lookIdA, lookIdB, totalVotes, completionPercentage }) => ({
        battleId,
        lookIdA,
        lookIdB,
        totalVotes,
        completionPercentage,
      }));
      
    // Construct the response
    const stats: BattleStats = {
      totalBattles: battleIds.length,
      totalVotes,
      mostVotedBattleId,
      mostVotedBattleCount,
      recentBattles,
    };
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error("Error processing battle stats:", error);
    return NextResponse.json(
      { error: "Failed to retrieve battle statistics" },
      { status: 500 }
    );
  }
}

export async function POST() {
  // For this endpoint, POST behaves the same as GET since we're just retrieving stats
  return GET();
} 