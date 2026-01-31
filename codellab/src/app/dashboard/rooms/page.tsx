import { RoomManagement } from "@/components/room-management";

export default function DashboardRoomsPage() {
  return (
    <div className="">
      <RoomManagement showOnlyMyRooms={true} />
    </div>
  );
}
