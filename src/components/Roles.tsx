import * as React from 'react';
import AllRoles from './RoleDescription';
import {Phase} from "../types/types";

interface RoleProps {
    phaseNumber: Phase
}

export default function Roles(props: RoleProps) {
  const { phaseNumber } = props;

  return (
    <div className="container roles">
      <ul className="list-unstyled">
        {
            AllRoles.map(
              role => role.render(phaseNumber)
            )
        }
      </ul>
    </div>
  );
}
