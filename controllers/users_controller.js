import { dbQuery } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default class UsersController {
    // List all users
    async listAll(req, res) {
        try {
            const [results, fields] = await dbQuery('SELECT uuid, username, email, users.CREATED, lastLogin, statut, bio FROM users ORDER BY users.username');
            res.send(results);
        } catch (err) {
            console.log('Une erreur est survenue lors de la récupération des utilisateurs');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    // Get one user by his uuid
    async getOne(req, res) {
        try {
            const [results, fields] = await dbQuery('SELECT username, email, CREATED, lastLogin, status, bio FROM users WHERE uuid = ?', [req.params.uuid]);
            res.send(results);
        } catch (err) {
            console.log('Une erreur est survenue lors de la récupération de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    // Get one user by his username
    async getOneByUsername(req, res) {
        try {
            const [results, fields] = await dbQuery('SELECT uuid, username, email ,users.CREATED, lastLogin, statut, bio FROM users WHERE username = ?', [req.params.username]);
            res.send(results);
        } catch (err) {
            console.log('Une erreur est survenue lors de la récupération de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }


    // Update a user
    async update(req, res) {
        try {
            const [results] = await dbQuery('UPDATE users SET username = ?, email = ?, bio = ? WHERE uuid = ?', [req.body.username, req.body.email, req.body.bio, req.params.uuid]);
            res.json({ message: "User updated", results: results });
        } catch (err) {
            console.log('Une erreur est survenue lors de la mise à jour du nom d\'utilisateur de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }

    }

    // Update a user password by his uuid
    async updatePwd(req, res) {
        try {
            const [results] = await dbQuery('UPDATE users SET pwd = ? WHERE uuid = ?', [req.body.pwd, req.params.uuid]);
            res.json({ message: "User updated", results: results });
        } catch (err) {
            console.log('Une erreur est survenue lors de la mise à jour du mot de passe de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    // Delete a user by his uuid
    async delete(req, res) {
        try {
            const [results, fields] = await dbQuery('DELETE FROM users WHERE uuid = ?', [req.params.uuid]);
            res.json({ message: "User deleted", results: results });
        } catch (err) {
            console.log('Une erreur est survenue lors de la suppression de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    // Login a user
    async login(req, res) {

        try {
            const [results, fields] = await dbQuery('SELECT * FROM users WHERE username = ?', [req.body.username.toLowerCase()]);
            if (results.length === 0) {
                return res.status(400).json({ error: 'User not found' });
            } else {
                const user = results[0];
                const validPwd = await bcrypt.compare(req.body.pwd, user.pwd);
                if (!validPwd) {
                    return res.status(400).json({ error: 'Invalid password' });
                }
                req.userUUID = user.uuid;
                const token = jwt.sign({ userUUID: user.uuid }, process.env.JWT_SECRET_KEY);
                // Include token in the response body
                res.header('Authorization', token).json({ message: 'Login successful', token: token, username: user.username, email: user.email, uuid: user.uuid, statut: user.statut});

                // Update last login date
                await dbQuery('UPDATE users SET lastLogin = NOW() WHERE uuid = ?', [user.uuid]);
            }
        } catch (err) {
            console.log('Une erreur est survenue lors de la connexion de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }


    // Create a new user
    async create(req, res) {
        const newUser = {
            username: req.body.username,
            email: req.body.email,
            pwd: await bcrypt.hash(req.body.pwd, 10),
            cgu: req.body.cgu
        };

        let emailExist = false;
        let usernameExist = false;

        try {

            const [resultsMail, fieldsMail] = await dbQuery('SELECT * FROM users WHERE email = ?', [newUser.email]);
            const [resultsUsername, fieldsUsername] = await dbQuery('SELECT * FROM users WHERE username = ?', [newUser.username]);

            if (resultsMail.length > 0) {
                mailExist = true;
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }

            if (resultsUsername.length > 0) {
                usernameExist = true;
                return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà utilisé' });
            }

            if (!emailExist && !usernameExist) {
                const [results, fields] = await dbQuery('INSERT INTO users (uuid, username, email, pwd, cgu) VALUES (UUID(), ?, ?, ?, ?)', [newUser.username, newUser.email, newUser.pwd, newUser.cgu]);
                res.json({ message: "Utilisateur crée avec success", results: results });
            }

        } catch (err) {
            console.log(err, 'Une erreur est survenue lors de la création de l\'utilisateur');
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }


}
