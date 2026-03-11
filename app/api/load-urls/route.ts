import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'storage', 'https___www_sbigeneral_in__2025-07-18T06-04-26-220Z.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json({
      urls: data.toVisit || [],
      success: true
    });
  } catch (error) {
    console.error('Error loading URLs:', error);
    return NextResponse.json({
      error: 'Failed to load URLs',
      success: false
    }, { status: 500 });
  }
}
