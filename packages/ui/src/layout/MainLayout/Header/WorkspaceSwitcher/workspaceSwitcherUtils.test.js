import { getUserAssignedWorkspaceOptions, shouldRequestWorkspaceSwitcherWorkspaces } from './workspaceSwitcherUtils'

describe('workspace switcher data source', () => {
    it('uses assigned workspaces from the login payload for self-IAM members without workspace directory permissions', () => {
        const features = { 'feat:workspaces': true }
        const user = {
            activeOrganizationId: 'org-1',
            assignedWorkspaces: [
                { id: 'ws-2', name: 'Beta', organizationId: 'org-1' },
                { id: 'ws-1', name: 'Alpha', organizationId: 'org-1' },
                { id: 'ws-other', name: 'Other', organizationId: 'org-2' }
            ]
        }

        expect(
            shouldRequestWorkspaceSwitcherWorkspaces({
                features,
                canReadWorkspaceDirectory: false
            })
        ).toBe(false)
        expect(getUserAssignedWorkspaceOptions(user)).toEqual([
            { id: 'ws-1', name: 'Alpha' },
            { id: 'ws-2', name: 'Beta' }
        ])
    })
})
