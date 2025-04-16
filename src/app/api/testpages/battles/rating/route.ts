import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lookId, battleId, rating, userId } = body;
    
    // Validate required fields
    if (!lookId) {
      return NextResponse.json(
        { error: "Missing required field: lookId" },
        { status: 400 }
      );
    }
    
    if (!battleId) {
      return NextResponse.json(
        { error: "Missing required field: battleId" },
        { status: 400 }
      );
    }
    
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 10" },
        { status: 400 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Normally, here we would save the rating to the database
    // Instead, we'll just return a success response
    
    // Generate a random total rating count and average
    const newTotalRatings = Math.floor(Math.random() * 50) + 10;
    const newAverageRating = parseFloat((Math.random() * 3 + 7).toFixed(1)); // Random between 7.0 and 10.0
    
    return NextResponse.json({
      success: true,
      message: `Rating of ${rating} for look ${lookId} in battle ${battleId} recorded successfully.`,
      lookId,
      battleId,
      stats: {
        averageRating: newAverageRating,
        totalRatings: newTotalRatings
      }
    });
  } catch (error) {
    console.error("Error processing rating:", error);
    return NextResponse.json(
      { error: "Failed to process rating" },
      { status: 500 }
    );
  }
} 