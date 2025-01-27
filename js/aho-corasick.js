    class AhoCorasick {
        constructor() {
            this.root = this.createNode();
        }

        createNode() {
            return {
                children: {},
                fail: null,
                outputs: []
            };
        }

        addPattern(pattern) {
            let node = this.root;
            for (const char of pattern) {
                if (!node.children[char]) {
                    node.children[char] = this.createNode();
                }
                node = node.children[char];
            }
            node.outputs.push(pattern);
        }

        buildFailureLinks() {
            const queue = [];
            for (const child of Object.values(this.root.children)) {
                child.fail = this.root;
                queue.push(child);
            }

            while (queue.length > 0) {
                const current = queue.shift();
                for (const [char, child] of Object.entries(current.children)) {
                    let fail = current.fail;
                    while (fail !== null && !fail.children[char]) {
                        fail = fail.fail;
                    }
                    child.fail = (fail !== null) ? fail.children[char] || this.root : this.root;
                    child.outputs = [...child.outputs, ...child.fail.outputs];
                    queue.push(child);
                }
            }
        }

        search(text) {
            let current = this.root;
            const results = [];
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                while (current !== null && !current.children[char]) {
                    current = current.fail;
                }
                current = current ? current.children[char] || this.root : this.root;
                
                if (current.outputs.length > 0) {
                    results.push(...current.outputs.map(pattern => ({
                        pattern,
                        index: i - pattern.length + 1
                    })));
                }
            }
            return results;
        }
    }

    export { AhoCorasick };