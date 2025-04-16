import { NextResponse } from 'next/server';

interface BattleResultRequest {
  battleId: string;
}

interface BattleResult {
  battleId: string;
  lookIdA: string;
  lookIdB: string;
  totalVotes: number;
  winningLookId: string | 'tie';
  votesForA: number;
  votesForB: number;
  percentageA: number;
  percentageB: number;
  aiCommentary?: string;
}

// Mock battle data
const mockBattles: Record<string, { lookIdA: string; lookIdB: string }> = {
  'battle1': { lookIdA: 'look1', lookIdB: 'look2' },
  'battle2': { lookIdA: 'look3', lookIdB: 'look4' },
  'battle3': { lookIdA: 'look5', lookIdB: 'look1' },
  'battle4': { lookIdA: 'look2', lookIdB: 'look3' },
};

// Mock vote data (these would be stored in a database in a real application)
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
    { lookId: 'look3', userId: 'user6' },
  ],
};

// Mock AI commentary
const aiCommentaries = [
  "The winning look successfully combines modern trends with classic elegance.",
  "This outfit stands out for its innovative color matching and seasonal appropriateness.",
  "Voters were drawn to the bold pattern choices and contemporary silhouette.",
  "The perfect balance of comfort and style gave this look the edge in this battle.",
  "The layering technique and textile contrast created a visually interesting ensemble that resonated with voters.",
];

export async function GET(request: Request) {
  try {
    // Get the battleId from the URL search params
    const { searchParams } = new URL(request.url);
    const battleId = searchParams.get('battleId');
    
    if (!battleId) {
      return NextResponse.json(
        { error: "battleId is required" },
        { status: 400 }
      );
    }
    
    // Check if battle exists
    if (!mockBattles[battleId]) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }
    
    // Get battle data
    const battle = mockBattles[battleId];
    const votes = mockVotes[battleId] || [];
    
    // Calculate results
    const totalVotes = votes.length;
    const votesForA = votes.filter(vote => vote.lookId === battle.lookIdA).length;
    const votesForB = votes.filter(vote => vote.lookId === battle.lookIdB).length;
    
    const percentageA = totalVotes > 0 ? Number(((votesForA / totalVotes) * 100).toFixed(1)) : 0;
    const percentageB = totalVotes > 0 ? Number(((votesForB / totalVotes) * 100).toFixed(1)) : 0;
    
    const winningLookId = votesForA > votesForB ? battle.lookIdA : 
                         votesForB > votesForA ? battle.lookIdB : 
                         'tie';
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate AI commentary if there's a clear winner
    let aiCommentary;
    if (winningLookId !== 'tie') {
      const randomIndex = Math.floor(Math.random() * aiCommentaries.length);
      aiCommentary = aiCommentaries[randomIndex];
    }
    
    const result: BattleResult = {
      battleId,
      lookIdA: battle.lookIdA,
      lookIdB: battle.lookIdB,
      totalVotes,
      winningLookId,
      votesForA,
      votesForB,
      percentageA,
      percentageB,
      aiCommentary
    };
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error("Error processing battle result:", error);
    return NextResponse.json(
      { error: "Failed to retrieve battle result" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as BattleResultRequest;
    const { battleId } = body;
    
    if (!battleId) {
      return NextResponse.json(
        { error: "battleId is required" },
        { status: 400 }
      );
    }
    
    // Check if battle exists
    if (!mockBattles[battleId]) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }
    
    // Get battle data and calculate results
    // (This is the same logic as in the GET method)
    const battle = mockBattles[battleId];
    const votes = mockVotes[battleId] || [];
    
    const totalVotes = votes.length;
    const votesForA = votes.filter(vote => vote.lookId === battle.lookIdA).length;
    const votesForB = votes.filter(vote => vote.lookId === battle.lookIdB).length;
    
    const percentageA = totalVotes > 0 ? Number(((votesForA / totalVotes) * 100).toFixed(1)) : 0;
    const percentageB = totalVotes > 0 ? Number(((votesForB / totalVotes) * 100).toFixed(1)) : 0;
    
    const winningLookId = votesForA > votesForB ? battle.lookIdA : 
                         votesForB > votesForA ? battle.lookIdB : 
                         'tie';
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate AI commentary if there's a clear winner
    let aiCommentary;
    if (winningLookId !== 'tie') {
      const randomIndex = Math.floor(Math.random() * aiCommentaries.length);
      aiCommentary = aiCommentaries[randomIndex];
    }
    
    const result: BattleResult = {
      battleId,
      lookIdA: battle.lookIdA,
      lookIdB: battle.lookIdB,
      totalVotes,
      winningLookId,
      votesForA,
      votesForB,
      percentageA,
      percentageB,
      aiCommentary
    };
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error("Error processing battle result:", error);
    return NextResponse.json(
      { error: "Failed to retrieve battle result" },
      { status: 500 }
    );
  }
} 