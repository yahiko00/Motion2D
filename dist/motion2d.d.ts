import G2D from "geometry2d/dist/geometry2d";
import Hitbox2D from "hitbox2d/dist/hitbox2d";
export default Motion2D;
declare namespace Motion2D {
    type Path = G2D.Point[];
    class Mobile {
        x: number;
        y: number;
        velocity: G2D.Vector;
        maxSpeed: number;
        hitbox: Hitbox2D.Hitbox;
        direction: number;
        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: Hitbox2D.Hitbox);
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
    }
    class SteeringMobile extends Mobile {
        mass: number;
        acceleration: G2D.Vector;
        path: Path | null;
        currentPathNode: number;
        pathDirection: number;
        constructor(x: number, y: number, maxSpeed: number, direction: number, hitbox: Hitbox2D.Hitbox, mass?: number, path?: Path | null, currentPathNode?: number);
        updatePosition(): void;
        updateVelocity(): void;
        nextVelocity(): G2D.Vector;
        stop(): void;
        flee(point: G2D.Point): void;
        seek(point: G2D.Point): void;
        seekArrival(point: G2D.Point, slowingRadius: number): void;
        seekRandomPoint(maxX: number, maxY: number): void;
        pursuit(target: Mobile, slowingRadius: number, tickAhead?: number): void;
        adaptativePursuit(target: Mobile, slowingRadius: number): void;
        evade(target: Mobile, tickAhead?: number): void;
        adaptativeEvade(target: Mobile): void;
        avoidObstacles(obstacles: Mobile[]): any;
        getAheadDistance(): number;
        getAheadArea(aheadDistance?: number): Mobile;
        private findMostThreateningObstacle(ahead, ahead2, ahead3, obstacles);
        followPath(tolerance: number, backAndForth?: boolean): boolean;
        moveAround(point: G2D.Point, distance: number, clockwise?: boolean): void;
        moveFront(target: Mobile, distance: number): boolean;
        moveBehind(target: Mobile, distance: number): boolean;
    }
}
