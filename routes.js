'use strict';
// imports - express, router, user and course, bcrypt for hashing
const express = require('express');
const router = express.Router();
const { User, Course } = require('./models');


// Import the auth-user middleware
const { authenticateUser } = require('./middleware/auth-user');

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
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
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

// Reads all courses and corresponding users, returns a 200 status
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
    res.status(200).json(courses);
}));

//Reads ONE course with corresponding users, returns a status code 200 with /courses/:id
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            },
        ],
    });
    course ? res.status(200).json(course) : res.status(400).json({ message: 'Course not found!'});
}));

//Creates a course location to header of URI, 200 response /courses
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201)
        .location(`/api/courses/${course.id}`)
        .end();
    } catch (error) {
        if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
            const errors = error.errors.map((err) => err.message);
            res.status(400).json({ errors });
        } else {
            throw error;
        }
    }
}));


//Updates a course, returns a 204 status code /courses/:id
//Complete with Exceeds Expectations, course updates only if User is owner.
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
    const course = await Course.findByPk(req.params.id);
    try {
        if (course) {
            if (course.userId === user.id) {
                await course.update(req.body);
                res.status(204).end();
            } else {
                res.status(403).json({ message: 'You are not authorized to update this course!' });
            }
        } else {
            res.status(404).json({ message: 'Course not found!' });
        }
    } catch (error) {
        if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
            const errors = error.errors.map((err) => err.message);
            res.status(400).json({ errors });
        } else {
            throw error;
        }
    }
}));

//Deletes a Course, returns 204 response /courses/:id
//Exceeds Expectations: Deletes course only if user is owner.
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
    const course = await Course.findByPk(req.params.id);

    if (course) {
        if (user.id === course.userId) {
            await course.destroy();
            res.status(204).end();
        } else {
            res.status(403).json({ message: 'Access Forbidden!' });
        }    
    } else {
        res.status(404).json({ message: 'Course not found' });
    }
}));

module.exports = router;