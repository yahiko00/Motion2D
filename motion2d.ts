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
    export interface Mobile extends Paon.Observable {
        x: number;
        y: number;
        velocity: G2D.Vector;
        maxSpeed: number;
        hitbox: HitboxCircle;
        direction: number;

        setMaxSpeed(maxSpeed: number): number;
        setDirection(angleRad: number): number;
        setVelocity(velocity: G2D.Vector): G2D.Vector;
        updatePosition(): void;
        moveXY(unitVector: G2D.Vector, speed?: number): void;
        moveToDirection(speed?: number): void;
        moveToPoint(point: G2D.Point, speed?: number): void;
        stop(): void;
        setDirectionToPoint(point: G2D.Point): void;
        getSpeed(): number;
        getDistanceToPoint(point: G2D.Point): number;
        getDistanceSqToPoint(point: G2D.Point): number;
    } // Mobile

    export class SteeringMobile implements Mobile {
        // Paon.Observable
        observers: Paon.Observer[];

        // Mobile
        x: number;
        y: number;
        velocity: G2D.Vector;
        maxSpeed: number; // in pixels per frame
        hitbox: HitboxCircle;
        direction: number;

        // SteeringMobile
        mass: number;
        acceleration: G2D.Vector;

        constructor(
            x: number, y: number, maxSpeed: number, direction: number, hitbox: HitboxCircle,
            mass = 1, target?: SteeringMobile) {
            this.observers = [];
            this.x = x;
            this.y = y;
            this.velocity = G2D.NULL_VEC;
            this.maxSpeed = maxSpeed;
            this.hitbox = hitbox;
            this.direction = direction;

            // SteeringMobile
            this.mass = mass;
            this.acceleration = G2D.NULL_VEC;
        } // constructor

        addObserver(observer: Paon.Observer): void {
            this.observers.push(observer);
        } // addObserver

        removeObserver(observer: Paon.Observer): void {
            for (let i = 0; i < this.observers.length; i++) {
                if (observer === this.observers[i]) {
                    this.observers.splice(i, 1);
                    return;
                }
            }
        } // removeObserver

        notifyObservers(msg: string, data?: any): void {
            for (let obs of this.observers) {
                obs(msg, data);
            }
        } // notifyObservers

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

        updatePosition(): void {
            // SteeringMobile
            this.acceleration = G2D.NULL_VEC;

            // Mobile
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.hitbox.x = this.x;
            this.hitbox.y = this.y;
        }

        updateVelocity(): void {
            this.acceleration = G2D.limitVector(this.acceleration, this.maxSpeed);
            this.acceleration = G2D.divVectorByScalar(this.acceleration, this.mass);
            this.setVelocity(G2D.addVectors(this.velocity, this.acceleration));
        }

        moveXY(unitVector: G2D.Vector, speed = this.maxSpeed): void {
            this.setVelocity(G2D.multVectorByScalar(unitVector,  Math.min(speed, this.maxSpeed)));
        }

        moveToDirection(): void {
            let vector = G2D.angleToUnitVector(this.direction);
            this.moveXY(vector);
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

        pursuit(target: Mobile, tickAhead = 3) {
            let futurePosition = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seek(futurePosition);
        }
    } // SteeringMobile

    export class BulletMobile implements Mobile {
        // Paon.Observable
        observers: Paon.Observer[];

        // Mobile
        x: number;
        y: number;
        velocity: G2D.Vector;
        maxSpeed: number; // in pixels per frame
        hitbox: HitboxCircle;
        direction: number;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: HitboxCircle) {
            this.observers = [];
            this.x = x;
            this.y = y;
            this.velocity = { x: 0, y: 0 };
            this.maxSpeed = maxSpeed;
            this.hitbox = hitbox;
            this.direction = direction;
        }

        addObserver(observer: Paon.Observer): void {
            this.observers.push(observer);
        } // addObserver

        removeObserver(observer: Paon.Observer): void {
            for (let i = 0; i < this.observers.length; i++) {
                if (observer === this.observers[i]) {
                    this.observers.splice(i, 1);
                    return;
                }
            }
        } // removeObserver

        notifyObservers(msg: string, data?: any): void {
            for (let obs of this.observers) {
                obs(msg, this);
            }
        } // notifyObservers

        setMaxSpeed(maxSpeed: number): number {
            this.maxSpeed = maxSpeed;
            return this.maxSpeed;
        }

        setDirection(angleRad: number): number {
            return this.direction = angleRad;
        }

        setVelocity(velocity: G2D.Vector): G2D.Vector {
            this.velocity = velocity;
            this.direction = G2D.unitVectorToAngle(G2D.normalizeVector(this.velocity));
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
            this.setVelocity(G2D.multVectorByScalar(unitVector,  Math.min(speed, this.maxSpeed)));
        }

        moveToDirection(): void {
            let vector = G2D.angleToUnitVector(this.direction);
            this.moveXY(vector);
        }

        moveToPoint(point: G2D.Point): void {
            this.setDirectionToPoint(point);
            this.moveXY(G2D.normalizeVector(G2D.subVectors(point, this)));
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
    } // BulletMobile
} // Motion2D
