import { NextResponse } from 'next/server';
import { getLeavesCollection, toObjectId } from '@/lib/leaves';
import { getSessionUser, isStaff } from '@/lib/loaAuth';
import { logStaffAction } from '@/lib/audit';

// PATCH /api/leaves/:id   body: { action: 'approve' | 'deny' | 'end' | 'cancel' }
export async function PATCH(request, { params }) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    // Next 15+ route params are asynchronous. Reading params.id before
    // awaiting params can turn undefined into a fresh ObjectId and a false 404.
    const { id } = await params;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
        return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
    }
    const _id = toObjectId(id);
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

    const result = await leaves.updateOne({ _id }, { $set: update });
    if (!result.matchedCount) {
        return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 });
    }

    const auditAction = {
        approve: 'leave_approved',
        deny: 'leave_denied',
        end: 'leave_ended_early',
        cancel: 'leave_withdrawn',
    }[action];
    await logStaffAction({
        session: { discordId: user.id, discordUsername: user.username },
        action: auditAction,
        meta: {
            leaveId: String(_id),
            subjectDiscordId: leave.userId,
            subjectUsername: leave.username,
            reason: leave.reason,
            startDate: leave.startDate,
            endDate: leave.endDate,
        },
    });

    const updated = await leaves.findOne({ _id });
    return NextResponse.json({ leave: updated });
}