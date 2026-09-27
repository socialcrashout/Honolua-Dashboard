import LeavesPage from '@/app/dashboard/leaves/page';

export const dynamic = 'force-dynamic';

export default function MyLeavePage() {
    return <LeavesPage employeeOnly />;
}
