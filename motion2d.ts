// motion2d.ts
/*!
MIT License

Copyright (c) 2016 Yahiko
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/// <reference path="../paon/dist/paon.d.ts" />
/// <reference path="../geometry2d/dist/geometry2d.d.ts" />

namespace Motion2D {
    export class Mobile {
        // Mobile
        x: number;
        y: number;
        velocity: G2D.Vector;
        maxSpeed: number; // in unit distance per tick
        hitbox: HitboxCircle;
        direction: number;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: HitboxCircle) {
            this.x = x;
            this.y = y;
            this.velocity = { x: 0, y: 0 };
            this.maxSpeed = maxSpeed;
            this.hitbox = hitbox;
            this.direction = direction;
        }

        setMaxSpeed(maxSpeed: number): number {
            this.maxSpeed = maxSpeed;
            return this.maxSpeed;
        }

        setDirection(angleRad: number): number {
            return this.direction = angleRad;
        }

        setVelocity(velocity: G2D.Vector): G2D.Vector {
            this.velocity = G2D.limitVector(velocity, this.maxSpeed);
            if (G2D.lengthSqVector(this.velocity) > G2D.EPSILON) {
                this.direction = G2D.unitVectorToAngle(G2D.normalizeVector(this.velocity));
            }
            return this.velocity;
        }

        updatePosition() {
            // Mobile
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.hitbox.x = this.x;
            this.hitbox.y = this.y;
        }

        moveXY(unitVector: G2D.Vector, speed = this.maxSpeed): void {
            this.setVelocity(G2D.multVectorByScalar(unitVector, Math.min(speed, this.maxSpeed)));
        }

        moveToDirection(speed = this.maxSpeed): void {
            let vector = G2D.angleToUnitVector(this.direction);
            this.moveXY(vector, speed);
        }

        moveToPoint(point: G2D.Point, speed = this.maxSpeed): void {
            this.moveXY(G2D.normalizeVector(G2D.subVectors(point, this)), speed);
        }

        stop(): void {
            this.setVelocity(G2D.NULL_VEC);
        }

        setDirectionToPoint(point: G2D.Point): void {
            let vector = { x: point.x - this.x, y: point.y - this.y };
            this.direction = G2D.unitVectorToAngle(G2D.normalizeVector(vector));
        }

        getSpeed(): number {
            return G2D.lengthVector(this.velocity);
        }

        getDistanceToPoint(point: G2D.Point): number {
            return G2D.distance(this, point);
        }

        getDistanceSqToPoint(point: G2D.Point): number {
            return G2D.distanceSq(this, point);
        }
    } // Mobile

    export class SteeringMobile extends Mobile {
        // SteeringMobile
        mass: number;
        acceleration: G2D.Vector;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: HitboxCircle, mass = 1) {
            super(x, y, maxSpeed, direction, hitbox);

            // SteeringMobile
            this.mass = mass;
            this.acceleration = G2D.NULL_VEC;
        } // constructor

        updatePosition(): void {
            // SteeringMobile
            this.acceleration = G2D.NULL_VEC;

            super.updatePosition();
        }

        updateVelocity(): void {
            this.acceleration = G2D.limitVector(this.acceleration, this.maxSpeed);
            this.acceleration = G2D.divVectorByScalar(this.acceleration, this.mass);
            this.setVelocity(G2D.addVectors(this.velocity, this.acceleration));
        }

        flee(point: G2D.Point): void {
            let prefVelocity = G2D.limitVector(G2D.subVectors(this, point), this.maxSpeed);
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seek(point: G2D.Point): void {
            let prefVelocity = G2D.limitVector(G2D.subVectors(point, this), this.maxSpeed);
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seekArrival(point: G2D.Point, slowingRadius: number): void {
            let prefVelocity = G2D.limitVector(G2D.subVectors(point, this), this.maxSpeed);
            let distance = this.getDistanceToPoint(point);

            if (distance <= slowingRadius) {
                prefVelocity = G2D.multVectorByScalar(prefVelocity, this.maxSpeed * distance / slowingRadius);
            }

            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seekRandomPoint(maxX: number, maxY: number, speed = this.maxSpeed): void {
            let point = { x: Math.random() * maxX, y: Math.random() * maxY };
            this.seek(point);
        }

        pursuit(target: Mobile, tickAhead = 3): void {
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seek(futurePosition);
        }

        adaptativePursuit(target: Mobile): void {
            let tickAhead = this.getDistanceToPoint(target) / target.maxSpeed;
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seek(futurePosition);
        }

        evade(target: Mobile, tickAhead = 3): void {
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.flee(futurePosition);
        }

        adaptativeEvade(target: Mobile): void {
            let tickAhead = this.getDistanceToPoint(target) / target.maxSpeed;
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.flee(futurePosition);
        }

        avoidObstacles(obstacles: HitboxCircle[]): any {
            let avoidance = G2D.NULL_VEC;
            let aheadDistance = this.hitbox.radius + 20 * G2D.lengthVector(this.velocity);
            let ahead: G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance));
            let ahead2: G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance / 2));
            let ahead3: G2D.Point = this;

            let mostThreateningObstacle = this.findMostThreateningObstacle(ahead, ahead2, ahead3, obstacles);
            if (mostThreateningObstacle) {
                avoidance = G2D.scaleVector(G2D.subVectors(ahead, mostThreateningObstacle), this.maxSpeed);
            }

            this.acceleration = G2D.addVectors(this.acceleration, avoidance);
            return {
                ahead: ahead,
                ahead2: ahead2,
                ahead3: ahead3,
                mostThreateningObstacle: mostThreateningObstacle
            };
        }

        private findMostThreateningObstacle(ahead: G2D.Point, ahead2: G2D.Point, ahead3: G2D.Point, obstacles: HitboxCircle[]): HitboxCircle | null {
            let mostThreateningObstacle: HitboxCircle | null = null;

            for (let i = 0; i < obstacles.length; i++) {
                let obstacle = obstacles[i];
                if (obstacle !== this.hitbox) {
                    let isCollision = G2D.pointInCircle(ahead, obstacle) || G2D.pointInCircle(ahead2, obstacle) || G2D.pointInCircle(ahead3, obstacle);

                    if (isCollision) {
                        if (!mostThreateningObstacle || G2D.distance(this, obstacle) < G2D.distance(this, mostThreateningObstacle)) {
                            mostThreateningObstacle = obstacle;
                        }
                    }
                }
            } // for i

            return mostThreateningObstacle;
        } // fintMostThreateningObstacle
    } // SteeringMobile
} // Motion2D
