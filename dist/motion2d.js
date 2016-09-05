// motion2d.ts
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "geometry2d/dist/geometry2d", "hitbox2d/dist/hitbox2d"], factory);
    }
})(function (require, exports) {
    "use strict";
    var geometry2d_1 = require("geometry2d/dist/geometry2d");
    var hitbox2d_1 = require("hitbox2d/dist/hitbox2d");
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Motion2D;
    var Motion2D;
    (function (Motion2D) {
        var Mobile = (function () {
            function Mobile(x, y, maxSpeed, direction, hitbox) {
                this.x = x;
                this.y = y;
                this.velocity = { x: 0, y: 0 };
                this.maxSpeed = maxSpeed;
                this.hitbox = hitbox;
                this.direction = direction;
            }
            Mobile.prototype.setMaxSpeed = function (maxSpeed) {
                this.maxSpeed = maxSpeed;
                return this.maxSpeed;
            };
            Mobile.prototype.setDirection = function (angleRad) {
                return this.direction = angleRad;
            };
            Mobile.prototype.setVelocity = function (velocity) {
                this.velocity = geometry2d_1.default.limitVector(velocity, this.maxSpeed);
                if (geometry2d_1.default.lengthSqVector(this.velocity) > geometry2d_1.default.EPSILON) {
                    this.direction = geometry2d_1.default.unitVectorToAngle(geometry2d_1.default.normalizeVector(this.velocity));
                }
                return this.velocity;
            };
            Mobile.prototype.updatePosition = function () {
                // Mobile
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.hitbox.x = this.x;
                this.hitbox.y = this.y;
            };
            Mobile.prototype.moveXY = function (unitVector, speed) {
                if (speed === void 0) { speed = this.maxSpeed; }
                this.setVelocity(geometry2d_1.default.multVectorByScalar(unitVector, Math.min(speed, this.maxSpeed)));
            };
            Mobile.prototype.moveToDirection = function (speed) {
                if (speed === void 0) { speed = this.maxSpeed; }
                var vector = geometry2d_1.default.angleToUnitVector(this.direction);
                this.moveXY(vector, speed);
            };
            Mobile.prototype.moveToPoint = function (point, speed) {
                if (speed === void 0) { speed = this.maxSpeed; }
                this.moveXY(geometry2d_1.default.normalizeVector(geometry2d_1.default.subVectors(point, this)), speed);
            };
            Mobile.prototype.stop = function () {
                this.setVelocity(geometry2d_1.default.NULL_VEC);
            };
            Mobile.prototype.setDirectionToPoint = function (point) {
                var vector = { x: point.x - this.x, y: point.y - this.y };
                this.direction = geometry2d_1.default.unitVectorToAngle(geometry2d_1.default.normalizeVector(vector));
            };
            Mobile.prototype.getSpeed = function () {
                return geometry2d_1.default.lengthVector(this.velocity);
            };
            return Mobile;
        }());
        Motion2D.Mobile = Mobile; // Mobile
        var SteeringMobile = (function (_super) {
            __extends(SteeringMobile, _super);
            function SteeringMobile(x, y, maxSpeed, direction, hitbox, mass, path, currentPathNode) {
                if (mass === void 0) { mass = 1; }
                if (currentPathNode === void 0) { currentPathNode = 0; }
                _super.call(this, x, y, maxSpeed, direction, hitbox);
                this.mass = mass;
                this.acceleration = geometry2d_1.default.NULL_VEC;
                this.path = path || null;
                this.currentPathNode = currentPathNode;
                this.pathDirection = 1;
            } // constructor
            SteeringMobile.prototype.updatePosition = function () {
                _super.prototype.updatePosition.call(this);
                this.acceleration = geometry2d_1.default.NULL_VEC;
            };
            SteeringMobile.prototype.updateVelocity = function () {
                this.acceleration = geometry2d_1.default.limitVector(this.acceleration, this.maxSpeed);
                this.acceleration = geometry2d_1.default.divVectorByScalar(this.acceleration, this.mass);
                this.setVelocity(geometry2d_1.default.addVectors(this.velocity, this.acceleration));
            };
            SteeringMobile.prototype.nextVelocity = function () {
                var acceleration = { x: this.acceleration.x, y: this.acceleration.y };
                acceleration = geometry2d_1.default.limitVector(acceleration, this.maxSpeed);
                acceleration = geometry2d_1.default.divVectorByScalar(acceleration, this.mass);
                return geometry2d_1.default.addVectors(this.velocity, acceleration);
            };
            SteeringMobile.prototype.stop = function () {
                _super.prototype.stop.call(this);
                this.acceleration = geometry2d_1.default.NULL_VEC;
            };
            SteeringMobile.prototype.flee = function (point) {
                var prefVelocity = geometry2d_1.default.limitVector(geometry2d_1.default.subVectors(this, point), this.maxSpeed);
                this.acceleration = geometry2d_1.default.addVectors(this.acceleration, geometry2d_1.default.subVectors(prefVelocity, this.velocity));
            };
            SteeringMobile.prototype.seek = function (point) {
                var prefVelocity = geometry2d_1.default.limitVector(geometry2d_1.default.subVectors(point, this), this.maxSpeed);
                this.acceleration = geometry2d_1.default.addVectors(this.acceleration, geometry2d_1.default.subVectors(prefVelocity, this.velocity));
            };
            SteeringMobile.prototype.seekArrival = function (point, slowingRadius) {
                var prefVelocity = geometry2d_1.default.limitVector(geometry2d_1.default.subVectors(point, this), this.maxSpeed);
                var distance = geometry2d_1.default.distance(this, point);
                if (distance <= slowingRadius) {
                    prefVelocity = geometry2d_1.default.multVectorByScalar(prefVelocity, this.maxSpeed * distance / slowingRadius);
                }
                this.acceleration = geometry2d_1.default.addVectors(this.acceleration, geometry2d_1.default.subVectors(prefVelocity, this.velocity));
            };
            SteeringMobile.prototype.seekRandomPoint = function (maxX, maxY) {
                var point = { x: Math.random() * maxX, y: Math.random() * maxY };
                this.seek(point);
            };
            SteeringMobile.prototype.pursuit = function (target, slowingRadius, tickAhead) {
                if (tickAhead === void 0) { tickAhead = 3; }
                var futureTarget = geometry2d_1.default.addVectors(target, geometry2d_1.default.multVectorByScalar(target.velocity, tickAhead));
                this.seekArrival(futureTarget, slowingRadius);
            };
            SteeringMobile.prototype.adaptativePursuit = function (target, slowingRadius) {
                var tickAhead = geometry2d_1.default.distance(this, target) / target.maxSpeed;
                var futureTarget = geometry2d_1.default.addVectors(target, geometry2d_1.default.multVectorByScalar(target.velocity, tickAhead));
                this.seekArrival(futureTarget, slowingRadius);
            };
            SteeringMobile.prototype.evade = function (target, tickAhead) {
                if (tickAhead === void 0) { tickAhead = 3; }
                var futureTarget = geometry2d_1.default.addVectors(target, geometry2d_1.default.multVectorByScalar(target.velocity, tickAhead));
                this.flee(futureTarget);
            };
            SteeringMobile.prototype.adaptativeEvade = function (target) {
                var tickAhead = geometry2d_1.default.distance(this, target) / target.maxSpeed;
                var futureTarget = geometry2d_1.default.addVectors(target, geometry2d_1.default.multVectorByScalar(target.velocity, tickAhead));
                this.flee(futureTarget);
            };
            SteeringMobile.prototype.avoidObstacles = function (obstacles) {
                var avoidance = geometry2d_1.default.NULL_VEC;
                var radius = 0;
                if (geometry2d_1.default.isCircle(this.hitbox)) {
                    radius = (this.hitbox).radius;
                }
                else if (geometry2d_1.default.isAABox(this.hitbox)) {
                    radius = Math.max((this.hitbox).halfDimX, (this.hitbox).halfDimY);
                }
                var aheadDistance = this.getAheadDistance();
                var ahead = geometry2d_1.default.addVectors(this, geometry2d_1.default.scaleVector(this.velocity, aheadDistance));
                var ahead2 = geometry2d_1.default.addVectors(this, geometry2d_1.default.scaleVector(this.velocity, aheadDistance / 2));
                var ahead3 = this;
                var mostThreateningObstacle = this.findMostThreateningObstacle(ahead, ahead2, ahead3, obstacles);
                if (mostThreateningObstacle) {
                    avoidance = geometry2d_1.default.scaleVector(geometry2d_1.default.subVectors(ahead, mostThreateningObstacle), this.maxSpeed);
                }
                this.acceleration = geometry2d_1.default.addVectors(this.acceleration, avoidance);
                return {
                    ahead: ahead,
                    ahead2: ahead2,
                    ahead3: ahead3,
                    mostThreateningObstacle: mostThreateningObstacle,
                    avoidance: avoidance
                };
            };
            SteeringMobile.prototype.getAheadDistance = function () {
                var aheadDistance = 0;
                if (geometry2d_1.default.isCircle(this.hitbox)) {
                    aheadDistance = this.hitbox.radius * (1 + geometry2d_1.default.lengthVector(this.velocity));
                }
                else {
                    aheadDistance = Math.max(this.hitbox.halfDimX, this.hitbox.halfDimY) * (1 + geometry2d_1.default.lengthVector(this.velocity));
                }
                return aheadDistance;
            };
            SteeringMobile.prototype.getAheadArea = function (aheadDistance) {
                if (aheadDistance === void 0) { aheadDistance = this.getAheadDistance(); }
                var point = geometry2d_1.default.addVectors(this, geometry2d_1.default.scaleVector(this.velocity, aheadDistance));
                var area = new Mobile(point.x, point.y, this.maxSpeed, this.direction, { x: point.x, y: point.y, radius: aheadDistance });
                area.setVelocity(this.velocity);
                return area;
            };
            SteeringMobile.prototype.findMostThreateningObstacle = function (ahead, ahead2, ahead3, obstacles) {
                var mostThreateningObstacle = null;
                for (var i = 0; i < obstacles.length; i++) {
                    var obstacle = obstacles[i];
                    if (obstacle !== this) {
                        var isCollision = hitbox2d_1.default.pointInHitbox(ahead, obstacle.hitbox) ||
                            hitbox2d_1.default.pointInHitbox(ahead2, obstacle.hitbox) ||
                            hitbox2d_1.default.pointInHitbox(ahead3, obstacle.hitbox);
                        if (isCollision) {
                            if (!mostThreateningObstacle || geometry2d_1.default.distance(this, obstacle) < geometry2d_1.default.distance(this, mostThreateningObstacle)) {
                                mostThreateningObstacle = obstacle;
                            }
                        }
                    }
                } // for i
                return mostThreateningObstacle;
            }; // findMostThreateningObstacle
            SteeringMobile.prototype.followPath = function (tolerance, backAndForth) {
                if (backAndForth === void 0) { backAndForth = false; }
                if (this.path && this.path.length > 0) {
                    var target = this.path[this.currentPathNode];
                    this.seek(target);
                    if (geometry2d_1.default.distanceSq(this, target) <= tolerance * tolerance) {
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
            }; // followPath
            SteeringMobile.prototype.moveAround = function (point, distance, clockwise) {
                if (clockwise === void 0) { clockwise = true; }
                var direction = -1;
                if (!clockwise) {
                    direction = 1;
                }
                var toPoint = geometry2d_1.default.subVectors(this, point);
                var contact = geometry2d_1.default.scaleVector(toPoint, distance);
                var attraction = geometry2d_1.default.subVectors(contact, toPoint);
                var tangent = geometry2d_1.default.scaleVector(geometry2d_1.default.tangentUnitVectorCircle({ x: point.x, y: point.y, radius: distance }, this), direction * this.maxSpeed);
                this.acceleration = geometry2d_1.default.addVectors(this.acceleration, geometry2d_1.default.subVectors(attraction, this.velocity));
                this.acceleration = geometry2d_1.default.addVectors(this.acceleration, geometry2d_1.default.subVectors(tangent, this.velocity));
            }; // moveAround
            SteeringMobile.prototype.moveFront = function (target, distance) {
                var targetDirectionVector = geometry2d_1.default.angleToUnitVector(target.direction);
                var toTarget = geometry2d_1.default.subVectors(target, this);
                var a1 = target.direction;
                var a2 = geometry2d_1.default.unitVectorToAngle(geometry2d_1.default.normalizeVector(toTarget));
                if (Math.abs(Math.abs(a1 - a2) - Math.PI) < 0.01) {
                    return true;
                }
                var determinant = geometry2d_1.default.detVectors(targetDirectionVector, toTarget);
                var clockwise = determinant > 0; // On the left
                this.moveAround(target, distance, clockwise);
                return false;
            }; // moveFront
            SteeringMobile.prototype.moveBehind = function (target, distance) {
                var targetDirectionVector = geometry2d_1.default.angleToUnitVector(target.direction);
                var toTarget = geometry2d_1.default.subVectors(target, this);
                var a1 = target.direction;
                var a2 = geometry2d_1.default.unitVectorToAngle(geometry2d_1.default.normalizeVector(toTarget));
                if (Math.abs(a1 - a2) < 0.01) {
                    return true;
                }
                var determinant = geometry2d_1.default.detVectors(targetDirectionVector, toTarget);
                var clockwise = determinant <= 0; // On the right
                this.moveAround(target, distance, clockwise);
                return false;
            }; // moveBehind
            return SteeringMobile;
        }(Mobile));
        Motion2D.SteeringMobile = SteeringMobile; // SteeringMobile
    })(Motion2D || (Motion2D = {})); // Motion2D
});
//# sourceMappingURL=motion2d.js.map