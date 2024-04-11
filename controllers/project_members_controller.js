import { dbQuery } from "../db.js";

export default class ProjectMembersController {
    // List all the project members
    async listAll(req, res) {
        const [results, fields] = await dbQuery(`SELECT * FROM project_members 
        JOIN users ON project_members.user_uuid = users.uuid
        JOIN project ON project_members.project_uuid = project.uuid
        WHERE project_uuid = ?`, [req.params.uuid]);
        res.send(results);
    }

    // Create a new project member
    async create(req, res) {
        const [results, fields] = await dbQuery('INSERT INTO project_members (project_uuid, user_uuid, role) VALUES (?, ?, ?)', [req.body.project_uuid, req.body.user_uuid, req.body.role]);
        res.send(results);
    }

    // Update a project member
    async update(req, res) {
        const [results, fields] = await dbQuery('UPDATE project_members SET role = ? WHERE id = ?', [req.body.role, req.params.id]);
        res.send(results);
    }

    // Delete a project member
    async delete(req, res) {
        const [results, fields] = await dbQuery('DELETE FROM project_members WHERE id = ?', [req.params.id]);
        res.send(results);
    }
}