import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Leave from '@/model/Leave';
import { getSessionUser, isStaff } from '@/lib/loaAuth';

// PATCH /api/leaves/:id   body: { action: 'approve' | 'deny' | 'end' | 'cancel' }
export async function PATCH(request, { params }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    await dbConnect();

    const { id } = params;
    const { action } = await request.json();
    const leave = await Leave.findById(id);
    if (!leave) return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });

    const staff = isStaff(user);

    if (action === 'cancel') {
        // The requester can withdraw their own pending request.
        if (leave.userId !== user.id && !staff) {
            return NextResponse.json({ error: 'Not your request.' }, { status: 403 });
        }
        if (leave.status !== 'pending') {
            return NextResponse.json({ error: 'Only a pending request can be withdrawn.' }, { status: 400 });
        }
        leave.status = 'cancelled';
        await leave.save();
        return NextResponse.json({ leave });
    }

    // approve / deny / end all require staff
    if (!staff) {
        return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
    }

    if (action === 'approve') {
        if (leave.status !== 'pending') {
            return NextResponse.json({ error: 'Only a pending request can be approved.' }, { status: 400 });
        }
        leave.status = 'approved';
    } else if (action === 'deny') {
        if (leave.status !== 'pending') {
            return NextResponse.json({ error: 'Only a pending request can be denied.' }, { status: 400 });
        }
        leave.status = 'denied';
    } else if (action === 'end') {
        if (leave.status !== 'approved') {
            return NextResponse.json({ error: 'Only an active leave can be ended early.' }, { status: 400 });
        }
        leave.endedEarly = true;
        leave.earlyEndDate = new Date();
    } else {
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    leave.decidedBy = user.id;
    leave.decidedByName = user.username;
    leave.decidedAt = new Date();
    await leave.save();

    return NextResponse.json({ leave });
}