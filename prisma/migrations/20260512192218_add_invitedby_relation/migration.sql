-- AddForeignKey
ALTER TABLE "WorkItemMemberInvitation" ADD CONSTRAINT "WorkItemMemberInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
