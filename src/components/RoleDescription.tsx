import * as React from 'react';
import {Phase} from "../types/types";

const enum RoleName {
    LEADERS = 'Leaders',
    UNITED_NATIONS = 'United nations',
    MILITARY = 'Military',
    CORPORATE_OPS = 'Corp Ops',
    SCIENTISTS = 'Scientists',
    PRESS = 'Press',
}

type PhaseDescription = {
    [key in Phase]: string;
};

abstract class RoleDescription {
    private readonly roleName: RoleName;

    constructor(roleName: RoleName) {
      this.roleName = roleName;
    }

    render(phase: Phase) {
      const { roleName } = this;
      const phaseDescription = this.phaseDescription()[phase];

      return (
        <li key={roleName}>
          <strong>{roleName}</strong>
          {` ${phaseDescription}`}
        </li>
      );
    }

    // eslint-disable-next-line no-unused-vars
    protected abstract phaseDescription(): PhaseDescription;
}

class Leader extends RoleDescription {
    private readonly phaseAction = 'negotiate';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
        4: this.phaseAction,
        5: this.phaseAction,
          6: this.phaseAction,
          7: this.phaseAction,
          8: this.phaseAction,
          9: this.phaseAction,
          10: this.phaseAction,
      };
    }
}

class UnitedNations extends RoleDescription {
    private readonly phaseAction = 'in session';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
        4: this.phaseAction,
        5: this.phaseAction,
          6: this.phaseAction,
          7: this.phaseAction,
          8: this.phaseAction,
          9: this.phaseAction,
          10: this.phaseAction,
      };
    }
}

class Military extends RoleDescription {
    private readonly phaseAction = 'at the maps';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
        4: this.phaseAction,
        5: this.phaseAction,
          6: this.phaseAction,
          7: this.phaseAction,
          8: this.phaseAction,
          9: this.phaseAction,
          10: this.phaseAction,
      };
    }
}

class CorporateOps extends RoleDescription {
    private readonly phaseAction = 'SELL SELL SELL';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
        4: this.phaseAction,
        5: this.phaseAction,
          6: this.phaseAction,
          7: this.phaseAction,
          8: this.phaseAction,
          9: this.phaseAction,
          10: this.phaseAction,
      };
    }
}

class Scientists extends RoleDescription {
    private readonly phaseAction = 'work it out';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
        4: this.phaseAction,
        5: this.phaseAction,
          6: this.phaseAction,
          7: this.phaseAction,
          8: this.phaseAction,
          9: this.phaseAction,
          10: this.phaseAction,
      };
    }
}

class Press extends RoleDescription {
    private readonly phaseAction = 'investigating stories';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
        4: this.phaseAction,
        5: this.phaseAction,
          6: this.phaseAction,
          7: this.phaseAction,
          8: this.phaseAction,
          9: this.phaseAction,
          10: this.phaseAction,
      };
    }
}

const AllRoles: Array<RoleDescription> = [
  new Leader(RoleName.LEADERS),
  new UnitedNations(RoleName.UNITED_NATIONS),
  new Military(RoleName.MILITARY),
  new CorporateOps(RoleName.CORPORATE_OPS),
  new Scientists(RoleName.SCIENTISTS),
  new Press(RoleName.PRESS),
];

export { AllRoles as default };
