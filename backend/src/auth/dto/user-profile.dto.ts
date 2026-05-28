export class UserTenantDto {
  id!: string;
  name!: string;
  inviteCode!: string;
}

export class UserProfileDto {
  id!: string;
  username!: string;
  tenants!: UserTenantDto[];
}
