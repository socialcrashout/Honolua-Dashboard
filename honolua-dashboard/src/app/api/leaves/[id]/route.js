import { NextResponse } from 'next/server';
import { getLeavesCollection, toObjectId } from '@/lib/leaves';
import { getSessionUser, isStaff } from '@/lib/loaAuth';

// PATCH /api/leaves/:id   body: { action: 'approve' | 'deny' | 'end' | 'cancel' }
export async function PATCH(request, { params }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    const _id = toObjectId(params.id);
    if (!_id) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

    const { action } = await request.json();
    const leaves = await getLeavesCollection();
    const leave = await leaves.findOne({ _id });
    if (!leave) return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });

    const staff = isStaff(user);
    const now = new Date();
    let update;

    if (action === 'cancel') {
        // The requester can withdraw their own pending request.
        if (leave.userId !== user.id && !staff) {
            return NextResponse.json({ error: 'Not your request.' }, { status: 403 });
        }
        if (leave.status !== 'pending') {
            return NextResponse.json({ error: 'Only a pending request can be withdrawn.' }, { status: 400 });
        }
        update = { status: 'cancelled', updatedAt: now };
    } else {
        // approve / deny / end all require staff
        if (!staff) {
            return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
        }

        if (action === 'approve') {
            if (leave.status !== 'pending') {
                return NextResponse.json({ error: 'Only a pending request can be approved.' }, { status: 400 });
            }
            update = { status: 'approved' };
        } else if (action === 'deny') {
            if (leave.status !== 'pending') {
                return NextResponse.json({ error: 'Only a pending request can be denied.' }, { status: 400 });
            }
            update = { status: 'denied' };
        } else if (action === 'end') {
            if (leave.status !== 'approved') {
                return NextResponse.json({ error: 'Only an active leave can be ended early.' }, { status: 400 });
            }
            update = { endedEarly: true, earlyEndDate: now };
        } else {
            return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
        }

        update.decidedBy = user.id;
        update.decidedByName = user.username;
        update.decidedAt = now;
        update.updatedAt = now;
    }

    await leaves.updateOne({ _id }, { $set: update });
    const updated = await leaves.findOne({ _id });
    return NextResponse.json({ leave: updated });
}