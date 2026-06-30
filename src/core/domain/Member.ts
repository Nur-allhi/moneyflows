export class Member {
  constructor(
    public id: string,
    public name: string,
    public shortName?: string,
    public email?: string,
    public phone?: string,
    public avatarUrl?: string,
    public isExternal: boolean = false,
    public metadata: Record<string, unknown> = {},
    public createdAt: string = new Date().toISOString(),
    public updatedAt: string = new Date().toISOString(),
    public deletedAt?: string,
  ) {}
}
