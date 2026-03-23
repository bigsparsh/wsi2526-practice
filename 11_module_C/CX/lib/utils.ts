export const strToBase46 = (x: any) => {
    if (typeof x === "string") {
        return Buffer.from(x).toString("base64")
    } else if (typeof x === "object") {
        return Buffer.from(JSON.stringify(x)).toString("base64")
    } else {
        return Buffer.from(x).toString("base64")
    }
}

export const base64ToStr = (x: any) => {
    return Buffer.from(x, "base64").toString();
}