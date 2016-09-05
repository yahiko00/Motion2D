// motion2d.ts

import G2D from "geometry2d/dist/geometry2d";
import Hitbox2D from "hitbox2d/dist/hitbox2d";

export default Motion2D;

namespace Motion2D {
    export type Path = G2D.Point[];

    export class Mobile {
        // Mobile
        x:         number;
        y:         number;
        velocity:  G2D.Vector;
        maxSpeed:  number; // in unit distance per tick
        hitbox:    Hitbox2D.Hitbox;
        direction: number;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: Hitbox2D.Hitbox) {
            this.x         = x;
            this.y         = y;
            this.velocity  = { x: 0, y: 0 };
            this.maxSpeed  = maxSpeed;
            this.hitbox    = hitbox;
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
            this.x       += this.velocity.x;
            this.y       += this.velocity.y;
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
    } // Mobile

    export class SteeringMobile extends Mobile {
        mass:            number;
        acceleration:    G2D.Vector;
        path:            Path | null;
        currentPathNode: number;
        pathDirection:   number;

        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: Hitbox2D.Hitbox, mass = 1, path?: Path | null, currentPathNode = 0) {
            super(x, y, maxSpeed, direction, hitbox);

            this.mass            = mass;
            this.acceleration    = G2D.NULL_VEC;
            this.path            = path || null;
            this.currentPathNode = currentPathNode;
            this.pathDirection = 1;
        } // constructor

        updatePosition(): void {
            super.updatePosition();
            this.acceleration = G2D.NULL_VEC;
        }

        updateVelocity(): void {
            this.acceleration = G2D.limitVector(this.acceleration, this.maxSpeed);
            this.acceleration = G2D.divVectorByScalar(this.acceleration, this.mass);
            this.setVelocity(G2D.addVectors(this.velocity, this.acceleration));
        }

        nextVelocity(): G2D.Vector {
            let acceleration = { x: this.acceleration.x, y: this.acceleration.y };
            acceleration = G2D.limitVector(acceleration, this.maxSpeed);
            acceleration = G2D.divVectorByScalar(acceleration, this.mass);
            return G2D.addVectors(this.velocity, acceleration);
        }

        stop(): void {
            super.stop();
            this.acceleration = G2D.NULL_VEC;
        }

        flee(point: G2D.Point): void {
            let prefVelocity  = G2D.limitVector(G2D.subVectors(this, point), this.maxSpeed);
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seek(point: G2D.Point): void {
            let prefVelocity  = G2D.limitVector(G2D.subVectors(point, this), this.maxSpeed);
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seekArrival(point: G2D.Point, slowingRadius: number): void {
            let prefVelocity = G2D.limitVector(G2D.subVectors(point, this), this.maxSpeed);
            let distance     = G2D.distance(this, point);

            if (distance <= slowingRadius) { // Inside the slowing radius
                prefVelocity = G2D.multVectorByScalar(prefVelocity, this.maxSpeed * distance / slowingRadius);
            }

            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(prefVelocity, this.velocity));
        }

        seekRandomPoint(maxX: number, maxY: number): void {
            let point = { x: Math.random() * maxX, y: Math.random() * maxY };
            this.seek(point);
        }

        pursuit(target: Mobile, slowingRadius: number, tickAhead = 3): void {
            let futureTarget = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seekArrival(futureTarget, slowingRadius);
        }

        adaptativePursuit(target: Mobile, slowingRadius: number): void {
            let tickAhead    = G2D.distance(this, target) / target.maxSpeed;
            let futureTarget = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.seekArrival(futureTarget, slowingRadius);
        }

        evade(target: Mobile, tickAhead = 3): void {
            let futureTarget = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.flee(futureTarget);
        }

        adaptativeEvade(target: Mobile): void {
            let tickAhead    = G2D.distance(this, target) / target.maxSpeed;
            let futureTarget = G2D.addVectors(target, G2D.multVectorByScalar(target.velocity, tickAhead));
            this.flee(futureTarget);
        }

        avoidObstacles(obstacles: Mobile[]): any {
            let avoidance = G2D.NULL_VEC;
            let radius    = 0;
            if (G2D.isCircle(this.hitbox)) {
                radius = (this.hitbox).radius;
            }
            else if (G2D.isAABox(this.hitbox)) {
                radius = Math.max((this.hitbox).halfDimX, (this.hitbox).halfDimY);
            }
            let aheadDistance = this.getAheadDistance();
            let ahead:  G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance));
            let ahead2: G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance / 2));
            let ahead3: G2D.Point = this;

            let mostThreateningObstacle = this.findMostThreateningObstacle(ahead, ahead2, ahead3, obstacles);
            if (mostThreateningObstacle) {
                avoidance = G2D.scaleVector(G2D.subVectors(ahead, mostThreateningObstacle), this.maxSpeed);
            }

            this.acceleration = G2D.addVectors(this.acceleration, avoidance);
            return {
                ahead:                   ahead,
                ahead2:                  ahead2,
                ahead3:                  ahead3,
                mostThreateningObstacle: mostThreateningObstacle,
                avoidance:               avoidance
            };
        }

        getAheadDistance(): number {
            let aheadDistance = 0;
            if (G2D.isCircle(this.hitbox)) {
                aheadDistance = this.hitbox.radius * (1 + G2D.lengthVector(this.velocity));
            }
            else /*if (G2D.isAABox(this.hitbox))*/ {
                aheadDistance = Math.max(this.hitbox.halfDimX, this.hitbox.halfDimY) * (1 + G2D.lengthVector(this.velocity));
            }
            return aheadDistance;
        }

        getAheadArea(aheadDistance = this.getAheadDistance()): Mobile {
            let point: G2D.Point = G2D.addVectors(this, G2D.scaleVector(this.velocity, aheadDistance));

            let area = new Mobile(point.x, point.y, this.maxSpeed, this.direction, { x: point.x, y: point.y, radius: aheadDistance });
            area.setVelocity(this.velocity);
            return area;
        }

        private findMostThreateningObstacle(ahead: G2D.Point, ahead2: G2D.Point, ahead3: G2D.Point, obstacles: Mobile[]): Mobile | null {
            let mostThreateningObstacle: Mobile | null = null;

            for (let i = 0; i < obstacles.length; i++) {
                let obstacle = obstacles[i];
                if (obstacle !== this) {
                    let isCollision =
                        Hitbox2D.pointInHitbox(ahead, obstacle.hitbox) ||
                        Hitbox2D.pointInHitbox(ahead2, obstacle.hitbox) ||
                        Hitbox2D.pointInHitbox(ahead3, obstacle.hitbox);

                    if (isCollision) {
                        if (!mostThreateningObstacle || G2D.distance(this, obstacle) < G2D.distance(this, mostThreateningObstacle)) {
                            mostThreateningObstacle = obstacle;
                        }
                    }
                }
            } // for i

            return mostThreateningObstacle;
        } // findMostThreateningObstacle

        followPath(tolerance: number, backAndForth = false): boolean {
            if (this.path && this.path.length > 0) {
                let target = this.path[this.currentPathNode];
                this.seek(target);

                if (G2D.distanceSq(this, target) <= tolerance * tolerance) {
                    this.currentPathNode += this.pathDirection;

                    if (this.currentPathNode >= this.path.length || this.currentPathNode < 0) {
                        if (backAndForth) {
                            this.pathDirection *= -1;
                            this.currentPathNode += this.pathDirection;
                        }
                        else {
                            this.currentPathNode = this.path.length - 1;
                            return true;
                        }
                    }
                }
            }

            return false;
        } // followPath

        moveAround(point: G2D.Point, distance: number, clockwise = true): void {
            let direction: number = -1;
            if (!clockwise) {
                direction = 1;
            }
            let toPoint    = G2D.subVectors(this, point);
            let contact    = G2D.scaleVector(toPoint, distance);
            let attraction = G2D.subVectors(contact, toPoint);
            let tangent    = G2D.scaleVector(G2D.tangentUnitVectorCircle({ x: point.x, y: point.y, radius: distance }, this), direction * this.maxSpeed);

            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(attraction, this.velocity));
            this.acceleration = G2D.addVectors(this.acceleration, G2D.subVectors(tangent, this.velocity));
        } // moveAround

        moveFront(target: Mobile, distance: number): boolean {
            let targetDirectionVector = G2D.angleToUnitVector(target.direction);
            let toTarget              = G2D.subVectors(target, this);
            let a1                    = target.direction;
            let a2                    = G2D.unitVectorToAngle(G2D.normalizeVector(toTarget));
            if (Math.abs(Math.abs(a1 - a2) - Math.PI) < 0.01) { // less than 6°
                return true;
            }
            let determinant = G2D.detVectors(targetDirectionVector, toTarget);
            let clockwise   = determinant > 0; // On the left
            this.moveAround(target, distance, clockwise);
            return false;
        } // moveFront

        moveBehind(target: Mobile, distance: number): boolean {
            let targetDirectionVector = G2D.angleToUnitVector(target.direction);
            let toTarget              = G2D.subVectors(target, this);
            let a1                    = target.direction;
            let a2                    = G2D.unitVectorToAngle(G2D.normalizeVector(toTarget));
            if (Math.abs(a1 - a2) < 0.01) { // less than 6°
                return true;
            }
            let determinant = G2D.detVectors(targetDirectionVector, toTarget);
            let clockwise   = determinant <= 0; // On the right
            this.moveAround(target, distance, clockwise);
            return false;
        } // moveBehind
    } // SteeringMobile
} // Motion2D
