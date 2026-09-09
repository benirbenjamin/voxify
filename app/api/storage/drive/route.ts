import { NextResponse } from 'next/server';
import { getDriveAccounts, getAccessTokenFromServiceAccount } from '@/lib/services/googleDriveService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const accountEmail = searchParams.get('email');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const accounts = await getDriveAccounts();
    let targetAccount = accountEmail
      ? accounts.find((a) => a.account_email.toLowerCase() === accountEmail.toLowerCase())
      : null;

    if (!targetAccount && accounts.length > 0) {
      targetAccount = accounts[0];
    }

    if (!targetAccount) {
      // Try direct public Google Drive file fetch fallback
      const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return NextResponse.redirect(publicUrl);
    }

    const accessToken = await getAccessTokenFromServiceAccount(targetAccount.credentials_json);

    // Forward Range header if requested by audio player / browser
    const rangeHeader = request.headers.get('range');
    const fetchHeaders: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: fetchHeaders,
    });

    if (!driveRes.ok) {
      console.error(`Google Drive proxy fetch error (status ${driveRes.status}):`, await driveRes.text());
      return NextResponse.json({ error: `Failed to fetch file from Google Drive (${driveRes.status})` }, { status: driveRes.status });
    }

    const responseHeaders = new Headers();

    const contentType = driveRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = driveRes.headers.get('content-length');
    const contentRange = driveRes.headers.get('content-range');
    const acceptRanges = driveRes.headers.get('accept-ranges') || 'bytes';

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Accept-Ranges', acceptRanges);
    responseHeaders.set('Cache-Control', 'public, max-age=86400');

    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    const status = driveRes.status === 206 ? 206 : 200;

    return new NextResponse(driveRes.body as any, {
      status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Google Drive proxy route error:', err);
    return NextResponse.json({ error: err.message || 'Error streaming Google Drive file' }, { status: 500 });
  }
}
