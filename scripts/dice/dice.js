export class basic_die extends foundry.dice.terms.DiceTerm {
    constructor(termData) {
        super(termData);
        this.faces = 6;
    }
}

export class computer_die extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = "c";
}

export class node_die extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = "n";
}

export class negative_node_die extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = "x";
}

export class mutant_die extends foundry.dice.terms.Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /** @override */
    static DENOMINATION = "m";
}