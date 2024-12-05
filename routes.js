'use strict';
// imports - express, router, user and course
const express = require('express');
const router = express.Router();
const { User, Course } = require('./models');

// Created a handler function as per video to simplify async handling
function asyncHandler(cb) {
    return async (req, res, next) => {
        try {
            await cb(req, res, next);
        } catch (error) {
            // Forwards the error to the global error handler
            next(error);
        }
    }
}


/* User Routes
    CREATE - Create a new user, endpoint - '/api/users' Returns 201
    READ - Returns all props of current authenticated user, 200
*/

// Read route - GET User; this might need to use middleware to authenticate the req... basic auth??
router.get('/users', asyncHandler(async (req, res) => {
    const user = req.currentUser;
    //ensuring that this returns the specific status code
    res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddress,
    });
}));

//Create route - POST status code 201
router.post('/users', asyncHandler(async (req, res) => {
    try {
        await User.create(req.body);
        res.status(201).location('/').end();
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });   
        } else {
            throw error;
        }
    }
}));


/* COURSE ROUTES
READ: GET all courses + user obj, 200 status code /api/courses
READ: GET A course + user obj, 200 status code /api/courses/:id
CREATE: POST a new course, location to header of URI, 201 response /api/courses
UPDATE: PUT a new course, return 204 /api/courses/:id 
DELETE: DELETE a course return 204 response /api/courses/:id
 */
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            },
        ],
    });
    res.json(courses);
}));



module.exports = router;