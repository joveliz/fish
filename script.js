const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const CENTER = {x: WIDTH/2, y: HEIGHT/2};

canvas.width = WIDTH;
canvas.height = HEIGHT;

function clearScreen() {
    c.clearRect(0, 0, WIDTH, HEIGHT);
}

function drawCircle(pos, radius, color) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    c.closePath();
    c.fill();
}

function drawEllipse(pos, radiusX, radiusY, rotation, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(pos.x, pos.y, radiusX, radiusY, rotation, 0, 2 * Math.PI);
    c.fill();
}

function drawShape(pointsArray, color) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(pointsArray[0].x, pointsArray[0].y);

    for (let i = 1; i < pointsArray.length - 1; i++) {
        const ax = (pointsArray[i + 1].x + pointsArray[i].x) / 2;
        const ay = (pointsArray[i + 1].y + pointsArray[i].y) / 2;

        c.quadraticCurveTo(pointsArray[i].x, pointsArray[i].y, ax, ay);
    }

    c.quadraticCurveTo(
        pointsArray[pointsArray.length - 1].x,
        pointsArray[pointsArray.length - 1].y,
        pointsArray[0].x,
        pointsArray[0].y,
    );

    c.fill();
}

function getDistance(pos1, pos2) {
    return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y);
}

function getAngle(pos1, pos2) {
    return Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
}

function getDirection(pos1, pos2, positive=true) {
    const angle = getAngle(pos1, pos2);
    let direction;

    if (positive) {
        direction = {
            x: Math.cos(angle),
            y: Math.sin(angle),
        };
    } else {
        direction = {
            x: -Math.cos(angle),
            y: -Math.sin(angle),
        };
    }
    
    return direction;
}

function getRandomDirection() {
    let x = 0
    
    while (x == 0) {
        x = Math.random() * 2 - 1;
    }

    let y = 0
    
    while (y == 0) {
        y = Math.random() * 2 - 1;
    }

    return getDirection({x: 0, y: 0}, {x: x, y: y});
}

function clamp(value, min, max) {
    if (value <= min) {
        return min;
    }
    if (value >= max) {
        return max;
    }
    return value;
}

function rotateVector(direction, angle) {

    const a = angle * (Math.PI/180);

    var cos = Math.cos(a);
    var sin = Math.sin(a);

    return {x: Math.round(10000*(direction.x * cos - direction.y * sin))/10000, 
    y: Math.round(10000*(direction.x * sin + direction.y * cos))/10000};
};

function getPointInRadius(pos, direction, angle, radius) {
    const newDirection = rotateVector(direction, angle);

    return {x: newDirection.x * radius + pos.x, y: newDirection.y * radius + pos.y};
}

function isOutOfBounds(obj) {
    let x = 0;
    let y = 0;

    if (obj.pos.x - obj.radius <= 0) {
        x = -1;
    }
    if (obj.pos.x + obj.radius >= WIDTH) {
        x = 1;
    }
    if (obj.pos.y - obj.radius <= 0) {
        y = -1;
    }
    if (obj.pos.y + obj.radius >= HEIGHT) {
        y = 1;
    }

    if (x == 0 && y ==0) {
        return false;

    }

    return {x: x, y: y};
}

function isColliding(obj1, obj2) {
    const distance = getDistance(obj1.pos, obj2.pos);
    if (distance < obj1.radius + obj2.radius) {
        return true;
    }
    return false;
}

function newBoid(color, radiusesArray) {
    const direction = getRandomDirection();
    const oppositeDirection = {x: - direction.x, y: - direction.y};
    const separation = radiusesArray[0] *1.5;

    const bodyArray = [];

    bodyArray.push(new Circle(CENTER, radiusesArray[0]));

    for (let i = 1; i < radiusesArray.length; i++) {

        const newPos = {
            x: oppositeDirection.x * separation + bodyArray[i-1].pos.x,
            y: oppositeDirection.y * separation + bodyArray[i-1].pos.y
        }

        const newBodyPart = new Circle(newPos, radiusesArray[i]);
        bodyArray.push(newBodyPart);
    }


    const tailArray = [];

    const tailPos = {
        x: oppositeDirection.x * (separation / 2) + bodyArray[radiusesArray.length - 1].pos.x,
        y: oppositeDirection.y * (separation / 2) + bodyArray[radiusesArray.length - 1].pos.y
    }

    tailArray.push(new Circle(tailPos, radiusesArray[radiusesArray.length - 1]));

    for (let i = 1; i < 4; i++) {
        const newTailPos = {
            x: oppositeDirection.x * (separation / 2) + tailArray[i - 1].pos.x,
            y: oppositeDirection.y * (separation / 2) + tailArray[i - 1].pos.y
        }

        tailArray.push(new Circle(newTailPos, radiusesArray[radiusesArray.length - 1]));
    }
  

    const newBoid = new Boid(color, direction, bodyArray, tailArray);
    
    return newBoid;
}

class Circle {
    constructor(pos, radius) {
        this.pos = pos;
        this.radius = radius;
    }

    updatePos(pos) {
        this.pos = pos;
    }
}

class Boid {
    constructor(color, direction, bodyArray, tail) {
        this.direction = direction;
        this.speed = (Math.floor(Math.random() * 10) / 10) + 1.5;
        this.body = bodyArray;
        this.tail = tail;
        this.color = color;
        this.eyeColor = this.color == "white" ? "gray" : "white";
        this.eyeDistance = this.body[0].radius * 0.75;
        this.initialEyeRadiusX = this.body[0].radius / 12;
        this.eyeRadiusX = this.initialEyeRadiusX;
        this.eyeRadiusY = this.eyeRadiusX * 3;
        this.finDistance = this.body[1].radius * 0.8;
        this.finRadiusX = this.body[0].radius / 4;
        this.finRadiusY = this.finRadiusX * 3;
        this.separation = bodyArray[0].radius * 1.5;
        this.tailSeparation = this.separation / 2;
        this.rotationAngle = 60;
        this.rotationTimer = clamp(Math.random() * 40, 10, 40);
        this.rotationTimerCounter = 0;
        this.blinkTimer = clamp(Math.random() * 360, 60, 360);
        this.blinkTimerCounter = 0;
        this.blinkDirection = -1;
        this.blinkStep = this.eyeRadiusX / 8;
    }

    updateRotationTimer() {
        this.rotationTimerCounter = this.rotationTimerCounter + 1;
    }

    updateBlinkTimer() {
        this.blinkTimerCounter = this.blinkTimerCounter + 1;
    }

    rotateDirection(angle) {
        this.direction = rotateVector(this.direction, angle);
        this.rotationTimerCounter = 0;
        this.rotationTimer = clamp(Math.random() * 40, 10, 40);
    }

    update() {
        const pointsArray = [];

        const newHeadPos = {
            x: this.body[0].pos.x + this.direction.x * this.speed,
            y: this.body[0].pos.y + this.direction.y * this.speed
        }

        this.body[0].updatePos(newHeadPos);

        pointsArray.push(getPointInRadius(newHeadPos, this.direction, 0, this.body[0].radius));
        pointsArray.push(getPointInRadius(newHeadPos, this.direction, -45, this.body[0].radius));
        pointsArray.push(getPointInRadius(newHeadPos, this.direction, -90, this.body[0].radius));
        pointsArray.unshift(getPointInRadius(newHeadPos, this.direction, 45, this.body[0].radius));
        pointsArray.unshift(getPointInRadius(newHeadPos, this.direction, 90, this.body[0].radius));

        for (let i = 1; i < this.body.length; i++) {
            const direction = getDirection(this.body[i-1].pos, this.body[i].pos);
            
            const newPartPos = {
                x: direction.x * this.separation + this.body[i-1].pos.x,
                y: direction.y * this.separation + this.body[i-1].pos.y
            }

            this.body[i].updatePos(newPartPos);

            pointsArray.push(getPointInRadius(newPartPos, direction, 90, this.body[i].radius));
            pointsArray.unshift(getPointInRadius(newPartPos, direction, -90, this.body[i].radius));
            
            if (i == this.body.length - 1) {
                pointsArray.unshift(getPointInRadius(newPartPos, direction, 0, this.body[i].radius));
            }
        }

        const tailPointsArray = [];

        const newTailDirection = getDirection(this.body[this.body.length - 1].pos, this.tail[0].pos);

        const newTailPos = {
            x: newTailDirection.x * this.tailSeparation + this.body[this.body.length - 1].pos.x,
            y: newTailDirection.y * this.tailSeparation + this.body[this.body.length - 1].pos.y
        }

        this.tail[0].updatePos(newTailPos);

        tailPointsArray.push(this.body[this.body.length - 1].pos);
        tailPointsArray.push(newTailPos);

        for (let i = 1; i < this.tail.length; i++) {
            const tailDirection = getDirection(this.tail[i - 1].pos, this.tail[i].pos);

            const tailPos = {
                x: tailDirection.x * this.tailSeparation + this.tail[i - 1].pos.x,
                y: tailDirection.y * this.tailSeparation + this.tail[i - 1].pos.y
            }

            this.tail[i].updatePos(tailPos);

            tailPointsArray.push(tailPos);
        }

        const bodyDirection = getDirection(this.body[1].pos, this.body[0].pos);

        const tailPointer = {
            x: tailPointsArray[tailPointsArray.length - 1].x + bodyDirection.x * this.body[0].radius,
            y: tailPointsArray[tailPointsArray.length - 1].y + bodyDirection.y * this.body[0].radius,
        };

        tailPointsArray.push(tailPointer);

        drawShape(tailPointsArray, this.color);


        const fins = [
            getPointInRadius(this.body[1].pos, bodyDirection, -90, this.finDistance),
            getPointInRadius(this.body[1].pos, bodyDirection, 90, this.finDistance)
        ];

        const finsAngleLeft = Math.atan2(newHeadPos.y - fins[0].y, newHeadPos.x - fins[0].x);
        const finsAngleRight = Math.atan2(newHeadPos.y - fins[1].y, newHeadPos.x - fins[1].x);

        drawEllipse(fins[1], this.finRadiusX, this.finRadiusY, finsAngleLeft, this.color);
        drawEllipse(fins[0], this.finRadiusX, this.finRadiusY, finsAngleRight, this.color);

        drawShape(pointsArray, this.color);

        const eyes = [
            getPointInRadius(newHeadPos, bodyDirection, -75, this.eyeDistance),
            getPointInRadius(newHeadPos, bodyDirection, 75, this.eyeDistance)
        ];

        const eyesAngleLeft = Math.atan2(eyes[0].y - newHeadPos.y, eyes[0].x - newHeadPos.x);
        const eyesAngleRight = Math.atan2(eyes[1].y - newHeadPos.y, eyes[1].x - newHeadPos.x);

        this.updateBlinkTimer();

        if (this.blinkTimerCounter >= this.blinkTimer) {
            this.eyeRadiusX = clamp(this.eyeRadiusX + (this.blinkDirection * this.blinkStep), 0, this.initialEyeRadiusX);

            if (this.eyeRadiusX == 0) {
                this.blinkDirection = 1;
            }

            if (this.eyeRadiusX == this.initialEyeRadiusX) {
                this.blinkDirection = -1;
                this.blinkTimerCounter = 0;
                this.blinkTimer = clamp(Math.random() * 360, 60, 360);
            }
        }

        drawEllipse(eyes[0], this.eyeRadiusX, this.eyeRadiusY, eyesAngleLeft, this.eyeColor);
        drawEllipse(eyes[1], this.eyeRadiusX, this.eyeRadiusY, eyesAngleRight, this.eyeColor);


        this.updateRotationTimer();

        const oob = isOutOfBounds(this.body[0]);

        if (oob !== false) {
            if (oob.x !== 0) {
                if (this.direction.y <= 0) {
                    this.rotateDirection(-1 * oob.x);
                } else {
                    this.rotateDirection(oob.x);
                }
            } else {
                if (this.direction.x <= 0) {
                    this.rotateDirection(oob.y);
                } else {
                    this.rotateDirection(-1 * oob.y);
                }
            }
        }

        if (this.rotationTimerCounter >= this.rotationTimer) {
            const randomAngle = Math.random() * this.rotationAngle - this.rotationAngle / 2;
            this.rotateDirection(randomAngle);
        }

    }
}

class GameManager {
    constructor (boidsArray) {
        this.boids = boidsArray;
    }

    loop() {
        clearScreen();

        for (const boid of this.boids) {
            boid.update();
        }

    }
}

const GM = new GameManager(
    [
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("gray", [20, 21, 16, 10, 4]),
        newBoid("white", [25, 28, 25, 20, 12, 5]),
        newBoid("black", [25, 28, 25, 20, 12, 5]),
    ]
);

function animate() {
    requestAnimationFrame(animate);
    GM.loop();
}

animate();