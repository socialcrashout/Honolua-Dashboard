import StaffSidebar from "@/components/Sidebar"

export default function StaffLayout({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
    >
      <StaffSidebar />
      <div className="transition-[padding] duration-200 md:pl-14 [[data-sidebar-expanded=true]_&]:md:pl-[216px]">
        {children}
      </div>
    </div>
  )
}